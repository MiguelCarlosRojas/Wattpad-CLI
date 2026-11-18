import http from 'http';
import { docs_v1, drive_v3, google } from 'googleapis';
import { CredentialStore } from '../../security/credential-store';
import { defaultConfig } from '../../config/config';
import { sha256 } from '../../security/crypto-utils';
import { Chapter } from '../../types/chapter.types';
import { Story } from '../../types/story.types';

export class GoogleService {
  private credentialStore: CredentialStore;
  private oauth2Client: any;

  constructor(credentialStore?: CredentialStore) {
    this.credentialStore = credentialStore || new CredentialStore();
    this.oauth2Client = new google.auth.OAuth2(
      defaultConfig.google.clientId,
      defaultConfig.google.clientSecret,
      defaultConfig.google.redirectUri
    );
  }

  public async isConnected(): Promise<boolean> {
    const tokens = await this.credentialStore.get('google_tokens');
    return Boolean(tokens);
  }

  public async getClient(): Promise<any | null> {
    const tokensJson = await this.credentialStore.get('google_tokens');
    if (!tokensJson) return null;

    try {
      const tokens = JSON.parse(tokensJson);
      this.oauth2Client.setCredentials(tokens);
      return this.oauth2Client;
    } catch {
      return null;
    }
  }

  public async initiateAuth(): Promise<{ authUrl: string; waitForAuth: () => Promise<boolean> }> {
    const scopes = [
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });

    const waitForAuth = (): Promise<boolean> => {
      return new Promise((resolve) => {
        const server = http.createServer(async (req, res) => {
          if (!req.url?.startsWith('/oauth2callback')) {
            res.writeHead(404);
            res.end('Not found');
            return;
          }

          const url = new URL(req.url, defaultConfig.google.redirectUri);
          const code = url.searchParams.get('code');

          if (!code) {
            res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h1>Error de autenticación: Código no encontrado.</h1>');
            server.close();
            resolve(false);
            return;
          }

          try {
            const { tokens } = await this.oauth2Client.getToken(code);
            await this.credentialStore.set('google_tokens', JSON.stringify(tokens));

            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(
              '<html><body style="font-family: sans-serif; text-align: center; padding-top: 50px;">' +
              '<h1 style="color: #28a745;">¡Conexión con Google Docs exitosa!</h1>' +
              '<p>Puedes cerrar esta ventana del navegador y regresar a Wattpad CLI.</p>' +
              '</body></html>'
            );
            server.close();
            resolve(true);
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`<h1>Error al canjear token: ${err}</h1>`);
            server.close();
            resolve(false);
          }
        });

        server.listen(8585, () => {
          // Server listening for redirect
        });

        // 3 minute timeout
        setTimeout(() => {
          try {
            server.close();
          } catch {}
          resolve(false);
        }, 180000);
      });
    };

    return { authUrl, waitForAuth };
  }

  public async disconnect(): Promise<void> {
    await this.credentialStore.remove('google_tokens');
  }

  public async exportChapterToGoogleDoc(
    story: Story,
    chapter: Chapter,
    existingDocId?: string
  ): Promise<{ docId: string; docUrl: string; hash: string }> {
    const auth = await this.getClient();
    if (!auth) {
      throw new Error('Google Docs no está conectado. Usa /connect google primero.');
    }

    const docs = google.docs({ version: 'v1', auth });
    const drive = google.drive({ version: 'v3', auth });

    const contentText = `${chapter.title}\n\n${chapter.content || ''}\n`;
    const hash = sha256(contentText);

    let docId = existingDocId;

    if (!docId) {
      // Create new Google Doc
      const createRes = await docs.documents.create({
        requestBody: {
          title: `[Wattpad] ${story.title} - Cap ${chapter.chapterNumber}: ${chapter.title}`,
        },
      });

      docId = createRes.data.documentId!;

      // Insert content
      await docs.documents.batchUpdate({
        documentId: docId,
        requestBody: {
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: contentText,
              },
            },
          ],
        },
      });
    } else {
      // Update existing document: fetch doc length, clear, and insert new content
      const doc = await docs.documents.get({ documentId: docId });
      const body = doc.data.body;
      const endIndex = (body?.content?.[body.content.length - 1]?.endIndex || 2) - 1;

      const requests: any[] = [];
      if (endIndex > 1) {
        requests.push({
          deleteContentRange: {
            range: {
              startIndex: 1,
              endIndex,
            },
          },
        });
      }
      requests.push({
        insertText: {
          location: { index: 1 },
          text: contentText,
        },
      });

      await docs.documents.batchUpdate({
        documentId: docId,
        requestBody: { requests },
      });
    }

    const docUrl = `https://docs.google.com/document/d/${docId}/edit`;
    return { docId, docUrl, hash };
  }

  public async importChapterFromGoogleDoc(docId: string): Promise<{ content: string; hash: string }> {
    const auth = await this.getClient();
    if (!auth) {
      throw new Error('Google Docs no está conectado. Usa /connect google primero.');
    }

    const docs = google.docs({ version: 'v1', auth });
    const res = await docs.documents.get({ documentId: docId });

    let fullText = '';
    const contentElements = res.data.body?.content || [];
    for (const elem of contentElements) {
      if (elem.paragraph) {
        for (const pElem of elem.paragraph.elements || []) {
          if (pElem.textRun?.content) {
            fullText += pElem.textRun.content;
          }
        }
      }
    }

    const cleaned = fullText.trim();
    return {
      content: cleaned,
      hash: sha256(cleaned),
    };
  }
}
