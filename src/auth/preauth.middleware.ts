import { Injectable, NestMiddleware } from '@nestjs/common';
import * as firebase from 'firebase-admin';
import * as serviceAccount from './firebaseServiceAccount.json';

const firebase_params = {
  type: serviceAccount.type,
  projectId: serviceAccount.project_id,
  privateKeyId: serviceAccount.private_key_id,
  privateKey: serviceAccount.private_key,
  clientEmail: serviceAccount.client_email,
  clientId: serviceAccount.client_id,
  authUri: serviceAccount.auth_uri,
  tokenUri: serviceAccount.token_uri,
  authProviderX509CertUrl: serviceAccount.auth_provider_x509_cert_url,
  clientC509CertUrl: serviceAccount.client_x509_cert_url,
};

@Injectable()
export class PreauthMiddleware implements NestMiddleware {
  private defaultApp: any;

  constructor() {
    this.defaultApp = firebase.initializeApp({
      credential: firebase.credential.cert(firebase_params),
    });
  }

  use(req: any, res: any, next: () => void) {
    const token = req.headers.authorization;

    if (!token) {
      console.error('Empty token');
      this.accessDenied(req.url, res);
      return;
    }

    this.defaultApp
      .auth()
      .verifyIdToken(token.replace('Bearer ', ''))
      .then(async (decodedToken) => {
        const user = {
          email: decodedToken.email,
        };
        req['user'] = user;
        next();
      })
      .catch((error) => {
        console.error(error);
        this.accessDenied(req.url, res);
      });
  }

  private accessDenied(url: string, res: any): void {
    res.status(403).json({
      statusCode: 403,
      timestamp: new Date().toISOString(),
      path: url,
      message: 'Access Denied',
    });
  }
}
