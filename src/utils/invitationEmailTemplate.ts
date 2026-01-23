import * as Linking from 'expo-linking';

/**
 * Génère le contenu d'un email d'invitation
 */
export const generateInvitationEmail = (
  clientName: string,
  projectName: string,
  token: string,
  expirationDate: Date
) => {
  // Créer l'URL de deep link
  const deepLinkUrl = `katos://invitation?token=${token}`;

  // URL de fallback pour ouvrir l'app store si l'app n'est pas installée
  const fallbackUrl = `https://katos-app.com/invitation?token=${token}`;

  const subject = `Invitation - Projet ${projectName}`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invitation Katos</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #007AFF, #0056D3);
          color: white;
          padding: 30px 20px;
          border-radius: 12px 12px 0 0;
          text-align: center;
        }
        .content {
          background: #ffffff;
          padding: 30px 20px;
          border: 1px solid #e0e0e0;
          border-top: none;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 0 0 12px 12px;
          border: 1px solid #e0e0e0;
          border-top: none;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
        .button {
          display: inline-block;
          background: #007AFF;
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin: 20px 0;
          text-align: center;
        }
        .project-details {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .warning {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          color: #856404;
          padding: 12px;
          border-radius: 6px;
          margin: 15px 0;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🏗️ Invitation Katos</h1>
        <p>Vous avez été invité(e) à rejoindre un projet</p>
      </div>

      <div class="content">
        <h2>Bonjour ${clientName} !</h2>

        <p>Vous avez été invité(e) à rejoindre le projet <strong>${projectName}</strong> sur l'application Katos.</p>

        <div class="project-details">
          <h3>📋 Détails du projet</h3>
          <p><strong>Nom du projet :</strong> ${projectName}</p>
          <p><strong>Client :</strong> ${clientName}</p>
        </div>

        <p>Pour accepter cette invitation et accéder aux informations de votre projet :</p>

        <p style="text-align: center;">
          <a href="${deepLinkUrl}" class="button">📱 Ouvrir dans l'app Katos</a>
        </p>

        <p style="text-align: center;">
          <small>
            Si le bouton ne fonctionne pas,
            <a href="${fallbackUrl}">cliquez ici</a> ou
            <a href="${deepLinkUrl}">copiez ce lien</a>
          </small>
        </p>

        <div class="warning">
          ⚠️ <strong>Important :</strong> Cette invitation expire le ${expirationDate.toLocaleDateString('fr-FR')} à ${expirationDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.
        </div>

        <h3>🔧 Comment procéder :</h3>
        <ol>
          <li>Installez l'application Katos sur votre téléphone (si ce n'est pas déjà fait)</li>
          <li>Créez votre compte ou connectez-vous</li>
          <li>Cliquez sur le bouton ci-dessus pour accepter l'invitation</li>
          <li>Accédez aux informations de votre projet en temps réel</li>
        </ol>

        <p>Une fois l'invitation acceptée, vous pourrez :</p>
        <ul>
          <li>✅ Suivre l'avancement de votre projet</li>
          <li>📷 Voir les photos et mises à jour</li>
          <li>📊 Consulter les matériaux utilisés</li>
          <li>📞 Communiquer avec l'équipe</li>
        </ul>
      </div>

      <div class="footer">
        <p>
          Cet email a été envoyé automatiquement par Katos.<br>
          Si vous n'êtes pas concerné(e) par cette invitation, vous pouvez ignorer cet email.
        </p>
        <p>
          <small>Token d'invitation : ${token}</small>
        </p>
      </div>
    </body>
    </html>
  `;

  const textBody = `
Invitation Katos - Projet ${projectName}

Bonjour ${clientName},

Vous avez été invité(e) à rejoindre le projet "${projectName}" sur l'application Katos.

Pour accepter cette invitation :
1. Installez l'app Katos sur votre téléphone
2. Créez votre compte ou connectez-vous
3. Ouvrez ce lien : ${deepLinkUrl}
4. Acceptez l'invitation

Cette invitation expire le ${expirationDate.toLocaleDateString('fr-FR')}.

Une fois acceptée, vous pourrez suivre l'avancement de votre projet en temps réel.

---
Token d'invitation : ${token}
Si vous rencontrez des problèmes, contactez notre support.
  `;

  return {
    subject,
    htmlBody,
    textBody,
    deepLinkUrl,
    fallbackUrl
  };
};

/**
 * Génère une URL universelle qui gère le fallback
 */
export const generateUniversalLink = (token: string): string => {
  // En production, ceci devrait être votre domaine web
  const webUrl = `https://katos-app.com/invitation?token=${token}`;

  // Pour le développement, vous pouvez utiliser un service comme Branch.io
  // ou créer votre propre service de redirection

  return webUrl;
};