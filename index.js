const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
//const logger = require("firebase-functions/logger");
const { FieldValue } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");
const nodemailer = require("nodemailer");
const { body, validationResult } = require("express-validator");
const axios = require("axios");
const serverless = require("serverless-http");
const Bull = require("bull");
const processingQueue = new Bull("processingQueue"); // Initialize a new Bull queue

const multer = require("multer");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const {
  ServicePrincipalCredentials,
  PDFServices,
  MimeType,
  OCRJob,
  OCRParams,
  OCRSupportedLocale,
  OCRSupportedType,
  OCRResult,
  SDKError,
  ServiceUsageError,
  ServiceApiError,
  ExtractPDFParams,
  ExtractElementType,
  ExtractPDFJob,
  ExtractPDFResult,
} = require("@adobe/pdfservices-node-sdk");

const winston = require("winston");
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

logger.info("Application has started.");

const AdmZip = require("adm-zip"); // Import the adm-zip module

require("dotenv").config();

const serviceAccount = {
  type: "service_account",
  project_id: "tercumatik-app",
  private_key_id: "f5c17843d60ce1890726613de61e467edb8f8663",
  private_key:
    "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCS9mGrIXhNv3rQ\nwxMVPxzY1q2Wmx5+phot+gqZ9LexxtetWvA4MuxIPBse3N5HrSr0Q6SxO6NL44XO\nDw4PcfV3aGtYpEhBzB/uaiJxZZ3rIpQ/8TdzOR+P8/xVIQLAFmoOtcc0xqepUOPt\n8KNAr70T7V204O5Z6PH68rnQm10EE4SFnYFUkaWj9nsV/Kecik/ItBxtNGpDgrJ1\ne7+ckOQAA+Qu4uiNU4leMNQKzNAfTQy37j7ZwPETjKJkcAm3JP28g2NW6fcZ+r/4\n2HLCEoA/G0V5cqK+OmReSIS1PIBBKXgS7F59nQqaV7uAmvBn4CcJhNrhmzuQ8482\nX91ynvBjAgMBAAECggEANe+n28s+YGZwmDKoC8mseCad8eK/V+L1Q797aZKHYn8k\nQ9LWzAFgd4hbucF88NhspdY3mPZW0bDQuFYNJn0ABlFz6EXu4PseEv2v42dUhGod\n97O7UpX57/avOr0RSddQGFL9p/BqszjlVjvVZpW48pnQpORShfv4501zBc0nX6mN\nvl6WXdn5aihueoV1RaLikqxIja3K+b87apGw3w3eInrhkz73Xf/5Y8h08tdT59Cj\nurAD38Cho7ReTelO2NeA8dzBD6u8uEAEi3VuGIx+5z24ePrbYgDRHcxrLCPePOQT\n20nTEuTgqGLUQkHW+qWBHNBc+DzonPf34y59HIHqZQKBgQDDLjVxTf4L6KWKjBqF\ngVnMJJM571ojrMJLcxbHYD23N007pgBBPdMVrWMFIYYTixiB0OEJYM/Dvii9aqZF\nfQVsj67tEQI9z0RrAQIP1A19TXjZCYibizPKgZiL4dIqNGpYBnVQ/lrdjP39XYpE\nVZwATXYcUM38E2DoZRvDyrjifQKBgQDAwcHKBPywwduwzRuNGQsO1FFiXJPmaNV0\nCJ1Eu3vz+17a60yJvlwQOFwWJ6YgFnVgVLJ30ghRI7/XsJenmvrNQimYC5pU4zq6\nJlKcMP9WzlAl3+1Na6g4M9Ro7/Mp2FXPxF7CuvaMgoYSJO/zriDL6qIgKhVwN5zv\nRqiWLD+0XwKBgB1LFiJHPlWzOQUuOdzHqR6GbsJHNhQcnZyNTWHnA9w3pJPLOkaQ\nbNnYCACBI4pTWf5Bx0SNDyGlrJ+hHgtX1DSS7AIQh3GXZgFZSWHuxYeE1Rpd3+7Y\nWZGPGcIExnInI77KWVkqk6CkxIn+O/49iwhQl+VwCzpF/kliw2QDTPRRAoGAQNRp\n8yI+QszQsOQrMgeMOo6aWLS+Ya48rGwBSQ6tn9+ZhZPCCEnn+OSbxC/Npdkn3SBf\nbgFMHs4hRc/1EcAEPmjUSHkOjSJnrBgbjMDGAFIfjr2DuJhO2ahE9o5NgHNsWRa4\nsFHlflif8xZNRe34xdzCboL49ucddzSSmv+C5Y0CgYEAlAOrTtoMfamQi/NnEWQ+\nc5IDTMfLoqM+7MqSlSqvRA2EJUbMHIZWFuzToZqV4U3TMhZWYGpIStNZez8FlrVD\nx2OvVLss2hjCipihaq454EJi39Xale68t8n/dnAbXe+x/E7imKhRaCFQEiH+mPhh\nmDm6lvXvlpP4NsPZ8prdHHI=\n-----END PRIVATE KEY-----\n",
  client_email:
    "firebase-adminsdk-b8yeg@tercumatik-app.iam.gserviceaccount.com",
  client_id: "112427986482968902980",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-b8yeg%40tercumatik-app.iam.gserviceaccount.com",
  universe_domain: "googleapis.com",
};

const defaultProfilePicUrl =
  "https://firebasestorage.googleapis.com/v0/b/tercumatik-app.appspot.com/o/Resources%2FDefault_pfp.svg?alt=media&token=a0a39261-4115-46c6-920f-aab66cae4640";

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const app = express();

const bucket = admin.storage().bucket("tercumatik-app.appspot.com");

//Middleware start

app.use(express.json());

app.use(cors({ origin: true }));

app.set("trust proxy", true);

const { format } = require("util"); // For formatting public URLs
const { Readable, isReadable } = require("stream"); // To handle in-memory file streaming

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const uploadDir = path.join("/tmp", "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const resetPasswordLink = "https://google.com";

const supportLink = "https://google.com";

async function sendEmail({ to, subject, htmlContent }) {
  if (!to || typeof to !== "string" || !to.includes("@")) {
    console.error("Invalid or missing 'to' address.");
    return false;
  }

  console.log("Sending email to:", to);

  try {
    await transporter.sendMail({
      from: '"Tercümatik" <mlgbaran@gmail.com>',
      to, // This should now be validated
      subject: subject,
      html: htmlContent,
    });

    console.log("Email sent successfully");
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

async function sendTeklifOnayMail(translationID, finalamount, to, token) {
  const htmlContent = `
  <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <title></title>
  <!--[if !mso]><!-->
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--<![endif]-->
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style type="text/css">
      #outlook a { padding:0; }
      body { margin:0; padding:0; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
      table, td { border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; }
      img { border:0; height:auto; line-height:100%; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
      p { display:block; margin:13px 0; }
  </style>
  <!--[if mso]>
  <noscript>
  <xml>
  <o:OfficeDocumentSettings>
  <o:AllowPNG/>
  <o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings>
  </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
      @media only screen and (min-width:480px) {
          .mj-column-per-100 { width:100% !important; max-width: 100%; }
          .mj-column-per-50 { width:50% !important; max-width: 50%; }
      }
  </style>
  <style media="screen and (min-width:480px)">
      .moz-text-html .mj-column-per-100 { width:100% !important; max-width: 100%; }
      .moz-text-html .mj-column-per-50 { width:50% !important; max-width: 50%; }
  </style>
  <style type="text/css">
      @media only screen and (max-width:480px) {
          table.mj-full-width-mobile { width: 100% !important; }
          td.mj-full-width-mobile { width: auto !important; }
      }
  </style>
  <style type="text/css">
      :root {
          color-scheme: light !important;
          supported-color-schemes: light !important;
      }
      @media only screen and (min-width:480px) {
          body:not(.gjs-dashed) .hidden-desktop { display: none !important; }
          div.mj-group-full-width { width: 100% !important; max-width: 100% !important; }
      }
      @media only screen and (max-width:480px) {
          body:not(.gjs-dashed) .hidden-mobile { display: none !important; }
      }
  </style>
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
</head>
<body style="word-spacing:normal;background-color:rgba(240,241,240,1);">
  <div style="background-color: white;">
      <div style="margin: 0px auto; max-width: 600px;">
          <table style="width: 100%;" role="presentation" border="0" cellspacing="0" cellpadding="0" align="center">
              <tbody>
                  <tr>
                      <td style="direction: ltr; font-size: 0px; padding: 0; text-align: center;">
                          <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size: 0px; text-align: left; direction: ltr; display: inline-block; vertical-align: top; width: 100%;">
                              <table style="vertical-align: top;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
                                  <tbody>
                                      <tr>
                                          <td class="mj-image" style="font-size: 0px; padding: 0; word-break: break-word;" align="center">
                                              <img style="border: 0; display: block; outline: none; text-decoration: none; height: auto; width: 100%; font-size: 13px;" src="https://firebasestorage.googleapis.com/v0/b/tercumatik-app.appspot.com/o/Resources%2Fpublic%2FEmail-banner.png?alt=media&token=b1cdc4d1-d529-41ae-a830-a45541b7df85" width="auto" height="auto" />
                                          </td>
                                      </tr>
                                  </tbody>
                              </table>
                          </div>
                      </td>
                  </tr>
              </tbody>
          </table>
      </div>
      <div style="background: white; margin: 0px auto; max-width: 600px;">
          <table style="background: white; width: 100%;" role="presentation" border="0" cellspacing="0" cellpadding="0" align="center">
              <tbody>
                  <tr>
                      <td style="direction: ltr; font-size: 0px; padding: 5px; text-align: center;">
                          <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size: 0px; text-align: left; direction: ltr; display: inline-block; vertical-align: top; width: 100%;">
                              <table style="vertical-align: top;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
                                  <tbody>
                                      <tr>
                                          <td class="mj-text" dir="ltr" style="font-size: 0px; padding: 5px; word-break: break-word;" align="left">
                                              <div style="font-family: Arial, sans-serif; font-size: 20px; font-weight: 900; line-height: 25px; text-align: left; color: #000000;">Teklif Onaylandı</div>
                                          </td>
                                      </tr>
                                      <tr>
                                          <td class="mj-text" dir="ltr" style="font-size: 0px; padding: 5px; word-break: break-word;" align="left">
                                              <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 20px; text-align: left; color: #000000;">Onay linkiniz</div>
                                          </td>
                                      </tr>
                                      <tr>
                                          <td class="mj-text" dir="ltr" style="background: white; font-size: 0px; padding: 5px; word-break: break-word;" align="left">
  <div style="font-family: Arial, sans-serif; font-size: 18px; line-height: 30px; text-align: left; color: rgba(86, 177, 108, 1);">
    <strong><a href="https://tercumatik-app.web.app/confirmation?trid=${translationID}&token=${token}" style="color: rgba(86, 177, 108, 1); text-decoration: none;">
      Ödeme işlemine başlamak için tıklayınız
    </a></strong>
  </div>
</td>
                                      </tr>
                                      <tr>
                                          <td class="mj-text" dir="ltr" style="font-size: 0px; padding: 5px; word-break: break-word;" align="left">
                                              <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 20px; text-align: left; color: #000000;">Tercüme edilecek dosyanız için ${finalamount.toFixed(
                                                2
                                              )}₺ değerindeki fiyat teklifi tercümanlarımız tarafından kabul edildi. Yukarıdaki link'e tıklayarak işlemi başlatabilirsiniz.</div>
                                          </td>
                                      </tr>
                                      <tr>
                                          <td class="mj-text" dir="ltr" style="font-size: 0px; padding: 5px; word-break: break-word;" align="left">
                                              <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 20px; text-align: left; color: #000000;">
                                                  <div>Bu işlemi siz yapmadınız mı? Lütfen <a href="${resetPasswordLink}" style="color: rgba(86, 177, 108, 1);">şifrenizi değiştirin</a> ve bir <a href="${supportLink}" style="color: rgba(86, 177, 108, 1);">destek talebi</a> oluşturun.</div>
                                                  <em>Bu otomatik bir mesajdır lütfen yanıtlamayınız.</em>
                                              </div>
                                          </td>
                                      </tr>
                                  </tbody>
                              </table>
                          </div>
                      </td>
                  </tr>
              </tbody>
          </table>
      </div>
      <!-- Footer Section -->
      <div style="margin: 0px auto; max-width: 590px;">
          <table style="width: 100%;" role="presentation" border="0" cellspacing="0" cellpadding="0" align="center">
              <tbody>
                  <tr>
                      <td class="mj-text" dir="ltr" style="font-size: 0px; padding: 5px; word-break: break-word;" align="center">
                          <div style="font-family: Arial, sans-serif; font-size: 11px; line-height: 15px; text-align: center; color: #000000;"><strong>&copy; 2024 Berliner.com.tr, Tüm Hakları Saklıdır.</strong></div>
                      </td>
                  </tr>
              </tbody>
          </table>
      </div>
  </div>
  <img alt="" src="https://example.com/tracking" style="display: none; width: 1px; height: 1px;">
</body>
</html>
  `;

  const subject = "Teklif Onaylandı";

  try {
    // Call the sendEmail function
    const success = await sendEmail({ to, subject, htmlContent });

    // Check if the email was sent successfully
    if (success) {
      console.log("Notification email sent successfully.");
    } else {
      const error = new Error("Failed to send notification email.");
      console.error(error.message);
      throw error; // Throw error if sending fails
    }
  } catch (error) {
    console.error("An error occurred while sending the email:", error);
    throw error; // Re-throw the error to be caught by the calling function
  }
}

async function sendCompletedMail(translationID, translatorID, to, token) {
  const htmlContent = `
  <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <title></title>
  <!--[if !mso]><!-->
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--<![endif]-->
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style type="text/css">
      #outlook a { padding:0; }
      body { margin:0; padding:0; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
      table, td { border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; }
      img { border:0; height:auto; line-height:100%; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
      p { display:block; margin:13px 0; }
  </style>
  <!--[if mso]>
  <noscript>
  <xml>
  <o:OfficeDocumentSettings>
  <o:AllowPNG/>
  <o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings>
  </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
      @media only screen and (min-width:480px) {
          .mj-column-per-100 { width:100% !important; max-width: 100%; }
          .mj-column-per-50 { width:50% !important; max-width: 50%; }
      }
  </style>
  <style media="screen and (min-width:480px)">
      .moz-text-html .mj-column-per-100 { width:100% !important; max-width: 100%; }
      .moz-text-html .mj-column-per-50 { width:50% !important; max-width: 50%; }
  </style>
  <style type="text/css">
      @media only screen and (max-width:480px) {
          table.mj-full-width-mobile { width: 100% !important; }
          td.mj-full-width-mobile { width: auto !important; }
      }
  </style>
  <style type="text/css">
      :root {
          color-scheme: light !important;
          supported-color-schemes: light !important;
      }
      @media only screen and (min-width:480px) {
          body:not(.gjs-dashed) .hidden-desktop { display: none !important; }
          div.mj-group-full-width { width: 100% !important; max-width: 100% !important; }
      }
      @media only screen and (max-width:480px) {
          body:not(.gjs-dashed) .hidden-mobile { display: none !important; }
      }
  </style>
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
</head>
<body style="word-spacing:normal;background-color:rgba(240,241,240,1);">
  <div style="background-color: white;">
      <div style="margin: 0px auto; max-width: 600px;">
          <table style="width: 100%;" role="presentation" border="0" cellspacing="0" cellpadding="0" align="center">
              <tbody>
                  <tr>
                      <td style="direction: ltr; font-size: 0px; padding: 0; text-align: center;">
                          <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size: 0px; text-align: left; direction: ltr; display: inline-block; vertical-align: top; width: 100%;">
                              <table style="vertical-align: top;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
                                  <tbody>
                                      <tr>
                                          <td class="mj-image" style="font-size: 0px; padding: 0; word-break: break-word;" align="center">
                                              <img style="border: 0; display: block; outline: none; text-decoration: none; height: auto; width: 100%; font-size: 13px;" src="https://firebasestorage.googleapis.com/v0/b/tercumatik-app.appspot.com/o/Resources%2Fpublic%2FEmail-banner.png?alt=media&token=b1cdc4d1-d529-41ae-a830-a45541b7df85" width="auto" height="auto" />
                                          </td>
                                      </tr>
                                  </tbody>
                              </table>
                          </div>
                      </td>
                  </tr>
              </tbody>
          </table>
      </div>
      <div style="background: white; margin: 0px auto; max-width: 600px;">
          <table style="background: white; width: 100%;" role="presentation" border="0" cellspacing="0" cellpadding="0" align="center">
              <tbody>
                  <tr>
                      <td style="direction: ltr; font-size: 0px; padding: 5px; text-align: center;">
                          <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size: 0px; text-align: left; direction: ltr; display: inline-block; vertical-align: top; width: 100%;">
                              <table style="vertical-align: top;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
                                  <tbody>
                                      <tr>
                                          <td class="mj-text" dir="ltr" style="font-size: 0px; padding: 5px; word-break: break-word;" align="left">
                                              <div style="font-family: Arial, sans-serif; font-size: 20px; font-weight: 900; line-height: 25px; text-align: left; color: #000000;">Tercüme Tamamlandı</div>
                                          </td>
                                      </tr>
                                      <tr>
                                          <td class="mj-text" dir="ltr" style="font-size: 0px; padding: 5px; word-break: break-word;" align="left">
                                              <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 20px; text-align: left; color: #000000;">Tercümeniz tamamlanmıştır. Peşin ödeme yaptıysanız hemen şimdi, peşin ödeme yapmadıysanız ise kalan ödemeyi yaptıktan sonra dosyalara erişiminiz sağlanacaktır. Ekstra depolama hizmeti alınmadığı takdirde sistemdeki çevrilen dosyalar 7 gün içinde silinecektir. Bizi tercih ettiğiniz için teşekkür ederiz.</div>
                                          </td>
                                      </tr>
                                      <tr>
                                          <td class="mj-text" dir="ltr" style="font-size: 0px; padding: 5px; word-break: break-word;" align="left">
                                              <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 20px; text-align: left; color: #000000;">Tercüme linkiniz</div>
                                          </td>
                                      </tr>
                                      <tr>
                                          <td class="mj-text" dir="ltr" style="background: white; font-size: 0px; padding: 5px; word-break: break-word;" align="left">
                                              <div style="font-family: Arial, sans-serif; font-size: 18px; line-height: 30px; text-align: left; color: rgba(86, 177, 108, 1);"><strong>https://tercumatik-app.web.app/translations/${translationID}?token=${token}
  </strong></div>
                                          </td>
                                      </tr>
                                      <tr>
                                          <td class="mj-text" dir="ltr" style="font-size: 0px; padding: 5px; word-break: break-word;" align="left">
                                              <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 20px; text-align: left; color: #000000;">
                                                  
                                                  <em>Bu otomatik bir mesajdır lütfen yanıtlamayınız.</em>
                                              </div>
                                          </td>
                                      </tr>
                                  </tbody>
                              </table>
                          </div>
                      </td>
                  </tr>
              </tbody>
          </table>
      </div>
      <!-- Footer Section -->
      <div style="margin: 0px auto; max-width: 590px;">
          <table style="width: 100%;" role="presentation" border="0" cellspacing="0" cellpadding="0" align="center">
              <tbody>
                  <tr>
                      <td class="mj-text" dir="ltr" style="font-size: 0px; padding: 5px; word-break: break-word;" align="center">
                          <div style="font-family: Arial, sans-serif; font-size: 11px; line-height: 15px; text-align: center; color: #000000;"><strong>&copy; 2024 Berliner.com.tr, Tüm Hakları Saklıdır.</strong></div>
                      </td>
                  </tr>
              </tbody>
          </table>
      </div>
  </div>
  <img alt="" src="https://example.com/tracking" style="display: none; width: 1px; height: 1px;">
</body>
</html>
  `;

  const subject = "Tercüme Tamamlandı";

  try {
    // Call the sendEmail function
    const success = await sendEmail({ to, subject, htmlContent });

    // Check if the email was sent successfully
    if (success) {
      console.log("Notification email sent successfully.");
    } else {
      const error = new Error("Failed to send notification email.");
      console.error(error.message);
      throw error; // Throw error if sending fails
    }
  } catch (error) {
    console.error("An error occurred while sending the email:", error);
    throw error; // Re-throw the error to be caught by the calling function
  }
}

async function sendNoterMail(
  iban,
  hesapno,
  sube,
  banka,
  to,
  noterPrice,
  translationID
) {
  const htmlContent = `
  <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <title></title>
  <!--[if !mso]><!-->
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--<![endif]-->
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style type="text/css">
      #outlook a { padding:0; }
      body { margin:0; padding:0; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
      table, td { border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; }
      img { border:0; height:auto; line-height:100%; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
      p { display:block; margin:13px 0; }
  </style>
  <!--[if mso]>
  <noscript>
  <xml>
  <o:OfficeDocumentSettings>
  <o:AllowPNG/>
  <o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings>
  </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
      @media only screen and (min-width:480px) {
          .mj-column-per-100 { width:100% !important; max-width: 100%; }
          .mj-column-per-50 { width:50% !important; max-width: 50%; }
      }
  </style>
  <style media="screen and (min-width:480px)">
      .moz-text-html .mj-column-per-100 { width:100% !important; max-width: 100%; }
      .moz-text-html .mj-column-per-50 { width:50% !important; max-width: 50%; }
  </style>
  <style type="text/css">
      @media only screen and (max-width:480px) {
          table.mj-full-width-mobile { width: 100% !important; }
          td.mj-full-width-mobile { width: auto !important; }
      }
  </style>
  <style type="text/css">
      :root {
          color-scheme: light !important;
          supported-color-schemes: light !important;
      }
      @media only screen and (min-width:480px) {
          body:not(.gjs-dashed) .hidden-desktop { display: none !important; }
          div.mj-group-full-width { width: 100% !important; max-width: 100% !important; }
      }
      @media only screen and (max-width:480px) {
          body:not(.gjs-dashed) .hidden-mobile { display: none !important; }
      }
  </style>
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
</head>
<body style="word-spacing:normal;background-color:rgba(240,241,240,1);">
  <div style="background-color: white;">
      <div style="margin: 0px auto; max-width: 600px;">
          <table style="width: 100%;" role="presentation" border="0" cellspacing="0" cellpadding="0" align="center">
              <tbody>
                  <tr>
                      <td style="direction: ltr; font-size: 0px; padding: 0; text-align: center;">
                          <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size: 0px; text-align: left; direction: ltr; display: inline-block; vertical-align: top; width: 100%;">
                              <table style="vertical-align: top;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
                                  <tbody>
                                      <tr>
                                          <td class="mj-image" style="font-size: 0px; padding: 0; word-break: break-word;" align="center">
                                              <img style="border: 0; display: block; outline: none; text-decoration: none; height: auto; width: 100%; font-size: 13px;" src="https://firebasestorage.googleapis.com/v0/b/tercumatik-app.appspot.com/o/Resources%2Fpublic%2FEmail-banner.png?alt=media&token=b1cdc4d1-d529-41ae-a830-a45541b7df85" width="auto" height="auto" />
                                          </td>
                                      </tr>
                                  </tbody>
                              </table>
                          </div>
                      </td>
                  </tr>
              </tbody>
          </table>
      </div>
      <div style="background: white; margin: 0px auto; max-width: 600px;">
          <table style="background: white; width: 100%;" role="presentation" border="0" cellspacing="0" cellpadding="0" align="center">
              <tbody>
                  <tr>
                      <td style="direction: ltr; font-size: 0px; padding: 5px; text-align: center;">
                          <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size: 0px; text-align: left; direction: ltr; display: inline-block; vertical-align: top; width: 100%;">
                              <table style="vertical-align: top;" role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
                                  <tbody>
                                      <tr>
                                          <td class="mj-text" dir="ltr" style="font-size: 0px; padding: 5px; word-break: break-word;" align="left">
                                              <div style="font-family: Arial, sans-serif; font-size: 20px; font-weight: 900; line-height: 25px; text-align: left; color: #000000;">Noter Ödemesi</div>
                                          </td>
                                      </tr>
                                      <tr>
                                          <td class="mj-text" dir="ltr" style="font-size: 0px; padding: 5px; word-break: break-word;" align="left">
                                              <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 20px; text-align: left; color: #000000;">Çevirinizin Noter Onayı için Noterlik'ten fiyat alınmıştır. Belgenizin Noter tarafından onaylanması için lütfen aşağıdaki transferi gerçekleştiriniz.</div>
                                          </td>
                                      </tr>
                                      <tr>
                                          <td class="mj-text" dir="ltr" style="font-size: 0px; padding: 5px; word-break: break-word;" align="left">
                                              <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 20px; text-align: left; color: #000000;">Ödeme ayrıntıları</div>
                                          </td>
                                      </tr>
                                      <tr>
                                          <td class="mj-text" dir="ltr" style="background: white; font-size: 0px; padding: 5px; word-break: break-word;" align="left">
                                              <div style="font-family: Arial, sans-serif; font-size: 18px; line-height: 25px; text-align: left; color: #000000;"><strong>Banka Adı:
  </strong>${banka}</div>
                                          </td>
                                      </tr>
                                      <tr>
                                          <td class="mj-text" dir="ltr" style="background: white; font-size: 0px; padding: 5px; word-break: break-word;" align="left">
                                              <div style="font-family: Arial, sans-serif; font-size: 18px; line-height: 25px; text-align: left; color: #000000;"><strong>Şube:
  </strong>${sube}</div>
                                          </td>
                                      </tr>
                                      <tr>
                                          <td class="mj-text" dir="ltr" style="background: white; font-size: 0px; padding: 5px; word-break: break-word;" align="left">
                                              <div style="font-family: Arial, sans-serif; font-size: 18px; line-height: 25px; text-align: left; color: #000000;"><strong>Hesap Numarası:
  </strong>${hesapno}</div>
                                          </td>
                                      </tr>
                                      <tr>
                                          <td class="mj-text" dir="ltr" style="background: white; font-size: 0px; padding: 5px; word-break: break-word;" align="left">
                                              <div style="font-family: Arial, sans-serif; font-size: 18px; line-height: 25px; text-align: left; color: #000000;"><strong>IBAN:
  </strong>${iban}</div>
                                          </td>
                                      </tr>
                                      <tr>
                                          <td class="mj-text" dir="ltr" style="background: white; font-size: 0px; padding: 5px; word-break: break-word;" align="left">
                                              <div style="font-family: Arial, sans-serif; font-size: 18px; line-height: 25px; text-align: left; color: #000000;"><strong>Tutar:
  </strong>${noterPrice}</div>
                                          </td>
                                      </tr>
                                      <tr>
                                          <td class="mj-text" dir="ltr" style="background: white; font-size: 0px; padding: 5px; word-break: break-word;" align="left">
                                              <div style="font-family: Arial, sans-serif; font-size: 18px; line-height: 25px; text-align: left; color: #000000;"><strong>Açıklama:
  </strong>${translationID}</div>
                                          </td>
                                      </tr>
                                      <tr>
                                          <td class="mj-text" dir="ltr" style="font-size: 0px; padding: 5px; word-break: break-word;" align="left">
                                              <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 20px; text-align: left; color: #000000;">
                                                  
                                                  <em>Bu otomatik bir mesajdır lütfen yanıtlamayınız.</em>
                                              </div>
                                          </td>
                                      </tr>
                                  </tbody>
                              </table>
                          </div>
                      </td>
                  </tr>
              </tbody>
          </table>
      </div>
      <!-- Footer Section -->
      <div style="margin: 0px auto; max-width: 590px;">
          <table style="width: 100%;" role="presentation" border="0" cellspacing="0" cellpadding="0" align="center">
              <tbody>
                  <tr>
                      <td class="mj-text" dir="ltr" style="font-size: 0px; padding: 5px; word-break: break-word;" align="center">
                          <div style="font-family: Arial, sans-serif; font-size: 11px; line-height: 15px; text-align: center; color: #000000;"><strong>&copy; 2024 Berliner.com.tr, Tüm Hakları Saklıdır.</strong></div>
                      </td>
                  </tr>
              </tbody>
          </table>
      </div>
  </div>
  <img alt="" src="https://example.com/tracking" style="display: none; width: 1px; height: 1px;">
</body>
</html>
  `;

  const subject = "Noter Ödemesi";

  try {
    // Call the sendEmail function
    const success = await sendEmail({ to, subject, htmlContent });

    // Check if the email was sent successfully
    if (success) {
      console.log("Notification email sent successfully.");
    } else {
      const error = new Error("Failed to send notification email.");
      console.error(error.message);
      throw error; // Throw error if sending fails
    }
  } catch (error) {
    console.error("An error occurred while sending the email:", error);
    throw error; // Re-throw the error to be caught by the calling function
  }
}

function analyzePages(jsonData) {
  const pagesData = {};

  jsonData.elements.forEach((element) => {
    const page = element.Page;
    const text = element.Text || "";

    if (!pagesData[page]) {
      pagesData[page] = {
        text: "",
        wordCount: 0,
        charCountWithoutSpaces: 0,
        charCountWithoutSpacesAndNumbers: 0,
      };
    }

    pagesData[page].text += text + " ";
  });

  for (const page in pagesData) {
    const pageData = pagesData[page];
    const text = pageData.text.trim();

    // Calculate word count
    pageData.wordCount = text.split(/\s+/).length;

    // Calculate character count without spaces
    const charCountWithoutSpaces = text.replace(/\s/g, "");
    pageData.charCountWithoutSpaces = charCountWithoutSpaces.length;

    // Calculate character count without spaces and numbers
    const charCountWithoutSpacesAndNumbers = charCountWithoutSpaces.replace(
      /\d/g,
      ""
    );
    pageData.charCountWithoutSpacesAndNumbers =
      charCountWithoutSpacesAndNumbers.length;
  }

  return pagesData;
}

const processImageWithTesseract = async (req, userUID, storageDir, bucket) => {
  try {
    // Implement Tesseract OCR logic here
    // Extract text and other data from the image

    const userLanguage = req.userLanguage;

    const extractedText = "Extracted text from image"; // Placeholder for extracted text

    // Save the extracted text as a TXT file in Firebase Storage
    const textFilePath = `${storageDir}/ExtractedText_${req.file.originalname}.txt`;
    const textFile = bucket.file(textFilePath);
    await textFile.save(extractedText.trim(), {
      contentType: "text/plain",
    });

    // Return standardized values
    return {
      language: userLanguage, // Replace with actual detected language
      pageCount: 1, // Image typically has only 1 "page"
      zipFileUrl: null, // No ZIP for image extraction, so set this to null
      textFilePath,
      pagesData: [], // Pages data for image can be left empty or structured based on image metadata
    };
  } catch (err) {
    console.error("Error processing image with Tesseract:", err);
    throw new Error("Error processing image with Tesseract");
  }
};

const processPDF = async (file, userUID, storageDir, bucket) => {
  try {
    const credentials = new ServicePrincipalCredentials({
      clientId: process.env.PDF_SERVICES_CLIENT_ID,
      clientSecret: process.env.PDF_SERVICES_CLIENT_SECRET,
    });
    const pdfServices = new PDFServices({ credentials });

    const readStream = Readable.from(file.buffer);
    const inputAsset = await pdfServices.upload({
      readStream,
      mimeType: MimeType.PDF,
    });

    const params = new ExtractPDFParams({
      elementsToExtract: [ExtractElementType.TEXT],
    });
    const job = new ExtractPDFJob({ inputAsset, params });
    const pollingURL = await pdfServices.submit({ job });
    const pdfServicesResponse = await pdfServices.getJobResult({
      pollingURL,
      resultType: ExtractPDFResult,
    });

    const resultAsset = pdfServicesResponse.result.resource;
    const streamAsset = await pdfServices.getContent({ asset: resultAsset });

    const zipFilePath = `${storageDir}/ExtractedText_${file.originalname}.zip`;
    const zipFile = bucket.file(zipFilePath);
    const zipWriteStream = zipFile.createWriteStream({
      metadata: { contentType: "application/zip" },
    });

    streamAsset.readStream.pipe(zipWriteStream);

    return new Promise((resolve, reject) => {
      zipWriteStream.on("finish", async () => {
        const [metadata] = await zipFile.getMetadata();
        const zipFileUrl = `https://storage.googleapis.com/${metadata.bucket}/${metadata.name}`;
        const [zipBuffer] = await zipFile.download();

        try {
          const zip = new AdmZip(zipBuffer);
          const jsonFile = zip.readAsText("structuredData.json");

          if (!jsonFile) {
            throw new Error("structuredData.json is missing or empty");
          }

          const jsonData = JSON.parse(jsonFile);
          const detectedLanguage = jsonData.extended_metadata.language;
          const pageCount = jsonData.extended_metadata.page_count;

          let extractedText = jsonData.elements
            .reduce((acc, element) => {
              return element.Text ? acc + " " + element.Text : acc;
            }, "")
            .trim();

          // Calculate charCountWithoutSpacesAndNumbers
          const charCountWithoutSpacesAndNumbers = extractedText.replace(
            /\s|\d/g,
            ""
          ).length;

          // Store the extracted text and character count in textData
          resolve({
            zipFileUrl,
            textFilePath: `${storageDir}/ExtractedText_${file.originalname}.txt`,
            language: detectedLanguage,
            textData: {
              text: extractedText,
              charCountWithoutSpacesAndNumbers,
            },
            pageCount,
          });
        } catch (err) {
          console.error("Error parsing structuredData.json:", err);
          reject(new Error("Error processing ZIP file contents"));
        }
      });

      zipWriteStream.on("error", (err) => {
        console.error("Error writing the ZIP file to Firebase Storage", err);
        reject(new Error("Error writing the ZIP file"));
      });
    });
  } catch (err) {
    console.error("Exception encountered while executing PDF extraction", err);
    throw new Error(err.message || "Error processing PDF extraction"); // Passes the exact Adobe error message up
  }
};

app.post(
  "/uploadTranslated",
  upload.array("translatedFiles"),
  async (req, res) => {
    const { userFullName, translationID, userUID } = req.body;

    if (!req.files || req.files.length === 0) {
      console.log("No files uploaded");
      return res.status(400).send("No files uploaded");
    }

    if (!translationID || !userUID) {
      return res.status(400).send("translationID and userUID are required");
    }

    try {
      const translationDocRef = db
        .collection("translations")
        .doc(translationID);
      const storageDir = `translations/${userUID}`;
      const filesCompleted = [];
      const uploadedFileNames = [];

      for (const file of req.files) {
        const prefixedFilename = `Tercümatik_${file.originalname}`;
        const rawFileName = file.originalname; // Original filename without prefix
        const originalFilePath = `${storageDir}/${prefixedFilename}`;
        const originalFileRef = bucket.file(originalFilePath);

        try {
          await originalFileRef.save(file.buffer, {
            contentType: file.mimetype,
          });
          console.log(
            "File uploaded with prefixed name to Firebase Storage:",
            prefixedFilename
          );
        } catch (err) {
          console.error("Error uploading file to Firebase Storage:", err);
          return res.status(500).send("Error uploading file");
        }

        const originalFileUrl = `https://storage.googleapis.com/${bucket.name}/${originalFilePath}`;

        filesCompleted.push({
          filename: prefixedFilename, // Prefixed filename
          originalFileUrl, // URL for the prefixed file
          rawFileName, // Original filename without the prefix
        });
        uploadedFileNames.push(rawFileName);
      }

      const newHistoryEntry = {
        timestamp: admin.firestore.Timestamp.now(),
        description: `Tercüman ${userFullName} şu dosyaları yükledi: ${uploadedFileNames.join(
          ", "
        )}.`,
        hidden: true,
      };

      await translationDocRef.update({
        filesCompleted: admin.firestore.FieldValue.arrayUnion(
          ...filesCompleted
        ),
        history: admin.firestore.FieldValue.arrayUnion(newHistoryEntry),
      });

      res
        .status(200)
        .json({ message: "Files uploaded and saved successfully." });
    } catch (error) {
      console.error("Error uploading and saving files:", error);
      res.status(500).json({ message: "Error uploading and saving files." });
    }
  }
);

app.post("/deleteUploadedFile", async (req, res) => {
  const { translationID, userUID, filename, userFullName } = req.body;

  if (!translationID || !userUID || !filename || !userFullName) {
    return res
      .status(400)
      .send("translationID, userUID, filename, and userFullName are required");
  }

  try {
    const filePath = `translations/${userUID}/${filename}`;
    const fileRef = bucket.file(filePath);

    // Delete the file from Firebase Storage
    await fileRef.delete();
    console.log("File deleted successfully from Firebase Storage:", filename);

    // Retrieve the translation document to get the exact object to remove
    const translationDocRef = db.collection("translations").doc(translationID);
    const translationDoc = await translationDocRef.get();

    if (!translationDoc.exists) {
      return res
        .status(404)
        .json({ message: "Translation document not found" });
    }

    const filesCompleted = translationDoc.data().filesCompleted || [];

    // Find the exact object to remove
    const fileToRemove = filesCompleted.find(
      (file) => file.filename === `${filename}`
    );

    if (fileToRemove) {
      // Remove the exact matching object from filesCompleted in Firestore
      await translationDocRef.update({
        filesCompleted: admin.firestore.FieldValue.arrayRemove(fileToRemove),
      });
      console.log("File entry removed from filesCompleted in Firestore.");
    } else {
      console.log("File entry not found in filesCompleted.");
    }

    // Add a history entry for the deletion
    const newHistoryEntry = {
      timestamp: admin.firestore.Timestamp.now(),
      description: `Tercüman ${userFullName} dosyayı sildi: ${filename}.`,
      hidden: false, // Set as visible if needed
    };

    await translationDocRef.update({
      history: admin.firestore.FieldValue.arrayUnion(newHistoryEntry),
    });

    res.status(200).json({
      message: "File deleted successfully and history updated.",
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ message: "Error deleting file." });
  }
});

app.post("/completeTranslation", async (req, res) => {
  const { translationID, translatorUID, translatorFullName } = req.body;

  // Check if the required fields are provided
  if (!translationID || !translatorUID || !translatorFullName) {
    return res.status(400).json({
      message:
        "translationID, translatorUID, and translatorFullName are required",
    });
  }

  try {
    // Retrieve the translation document by ID
    const translationRef = db.collection("translations").doc(translationID);
    const translationDoc = await translationRef.get();

    if (!translationDoc.exists) {
      return res.status(404).json({ message: "Translation not found" });
    }

    const translationData = translationDoc.data();

    // Check if the translation status is "translatortranslating"
    if (translationData.status !== "translatortranslating") {
      console.log(
        "Cannot complete translation because the status is not translatortranslating"
      );
      return res.status(400).json({
        message: "Çeviri durumu 'Çevriliyor' değil.",
      });
    }

    const isPesin = translationData.pesin;

    if (translationData.payments["0"].status !== "paid") {
      console.log(
        "Cannot complete translation because the first payment is not done yet."
      );
      return res.status(400).json({
        message: "İlk Ödeme yapılmamış",
      });
    }

    //if (!isPesin && !translationData.payments?.["1"]) {
    //  console.log(
    //    "Cannot complete translation because the second payment is not done yet and it is not pesin."
    //  );
    //  return res.status(400).json({
    //    message: "İkinci Ödeme yapılmamış",
    //  });
    //} else if (!isPesin && translationData.payments?.["1"]) {
    //  if (translationData.payments["1"].status !== "paid") {
    //    console.log(
    //      "Cannot complete translation because the second payment's status is not paid and it is not pesin."
    //    );
    //    return res.status(400).json({
    //      message: "İkinci Ödeme yapılmamış",
    //    });
    //  }
    //}

    const userUID = translationData.userUID.id;

    const userEmail = translationData.userEmail;

    const userName = translationData.userName;

    const userSurame = translationData.userSurname;

    let newStatus = "";
    let historyMessage = "";

    if (isPesin && translationData.payments["0"].status === "paid") {
      newStatus = "completed";
      historyMessage = `${translatorFullName} tercümeyi tamamladı. Dosyalar kullanıcıya açılıyor.`;
    } else if (!isPesin) {
      newStatus = "waitingusersecondpayment";
      historyMessage = `${translatorFullName} tercümeyi tamamladı. İkinci ödeme bekleniyor.`;
    }

    const newHistoryEntry = {
      timestamp: admin.firestore.Timestamp.now(),
      description: historyMessage,
      hidden: false,
    };

    await translationRef.update({
      status: newStatus,
      [newStatus === "completed"
        ? "completedAt"
        : "waitingUserSecondPaymentStartedAt"]: admin.firestore.Timestamp.now(),
      history: admin.firestore.FieldValue.arrayUnion(newHistoryEntry),
    });

    const customToken = await admin.auth().createCustomToken(userUID);

    sendCompletedMail(translationID, "test", userEmail, customToken);

    // Further logic to complete the translation would go here

    res.status(200).json({ message: "Tercüme başarıyla tamamlandı" });
  } catch (error) {
    console.error("Error completing translation:", error);
    res
      .status(500)
      .json({ message: "Bir hata oluştu, lütfen tekrar deneyiniz" });
  }
});

app.post("/uploadExtract", upload.array("files"), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    console.log("No files uploaded");
    return res.status(400).send("No files uploaded");
  }

  // Convert incoming language codes
  const languageMap = {
    gb: "en",
    ir: "fa",
    be: "fl",
    dk: "da",
    se: "sv",
    rs: "sr",
    tm: "tk",
    si: "sl",
    il: "he",
  };
  let incLanguage = languageMap[req.body.userLanguage] || req.body.userLanguage;

  console.log("Files received:", req.files.length);
  console.log("userLanguage:", incLanguage);

  try {
    const userUID = req.files[0].originalname.split("_")[0];
    if (!userUID) {
      console.log("Invalid or missing User UID");
      return res.status(400).send("Invalid or missing User UID");
    }

    // Prepare initial Firestore document with queued status
    const translationData = {
      active: true,
      userUID: db.doc(`users/${userUID}`),
      files: [],
      status: "waitingoffer", // Your existing status
      language: incLanguage,
      totalPageCount: 0,
      totalCharCount: 0,
      queueProgress: { totalFiles: req.files.length, completedFiles: 0 }, // New field for tracking progress
      createdAt: admin.firestore.Timestamp.now(),
      history: [
        {
          timestamp: admin.firestore.Timestamp.now(),
          description: "Dosya analiz için sıraya alındı",
          hidden: false,
        },
      ],
    };

    const translationRef = await db
      .collection("translations")
      .add(translationData);
    console.log("Firestore document created with ID:", translationRef.id);

    const userDocRef = db.doc(`users/${userUID}`);
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists) {
        throw new Error("User does not exist!");
      }
      const translations = userDoc.data().translations || [];
      translations.push(translationRef);
      transaction.update(userDocRef, { translations });
    });

    let completedFiles = 0;

    // Process each file asynchronously using setImmediate
    req.files.forEach((file) => {
      console.log("Starting processing for file:", file.originalname);

      setImmediate(async () => {
        try {
          const storageDir = `translations/${userUID}`;
          const originalFilePath = `${storageDir}/${file.originalname}`;
          const originalFileRef = bucket.file(originalFilePath);

          // Upload file to Firebase Storage
          await originalFileRef.save(file.buffer, {
            contentType: file.mimetype,
          });
          console.log(
            "File uploaded successfully to Firebase Storage:",
            file.originalname
          );

          const originalFileUrl = `https://storage.googleapis.com/${bucket.name}/${originalFilePath}`;
          let resultData;

          // Process based on file type
          if (file.mimetype === "application/pdf") {
            resultData = await processPDF(file, userUID, storageDir, bucket);
          } else if (
            [
              "image/png",
              "image/jpeg",
              "image/bmp",
              "image/pbm",
              "image/webp",
            ].includes(file.mimetype)
          ) {
            resultData = await processImageWithTesseract(
              file,
              userUID,
              storageDir,
              bucket
            );
          } else {
            throw new Error("Unsupported file type");
          }

          // Update Firestore document with processed file details
          await db
            .collection("translations")
            .doc(translationRef.id)
            .update({
              files: admin.firestore.FieldValue.arrayUnion({
                filename: file.originalname,
                rawFileName: file.originalname.split("_")[1],
                originalFileUrl,
                zipFileUrl: resultData.zipFileUrl,
                textFilePath: resultData.textFilePath,
                textData: resultData.textData,
                pageCount: resultData.pageCount,
              }),
              totalPageCount: admin.firestore.FieldValue.increment(
                resultData.pageCount || 0
              ),
              totalCharCount: admin.firestore.FieldValue.increment(
                resultData.textData.charCountWithoutSpacesAndNumbers || 0
              ),
              "queueProgress.completedFiles":
                admin.firestore.FieldValue.increment(1),
            });

          completedFiles += 1;
          console.log(
            `Processed ${completedFiles} of ${req.files.length} files`
          );
        } catch (error) {
          console.error("Error processing file:", error);

          // Update Firestore document with specific error message for this file
          await db
            .collection("translations")
            .doc(translationRef.id)
            .update({
              status: "failed", // Update status if processing fails
              active: false,
              error: {
                filename: file.originalname,
                message: error.message, // Save the exact error message from Adobe API
                code: error._errorCode || "UNKNOWN_ERROR",
              },
            });
        }
      });
    });

    res.status(200).json({
      message: "Files are being processed asynchronously",
      translationID: translationRef.id,
      language: incLanguage,
    });
  } catch (err) {
    console.error("Error in processing:", err);
    res.status(500).send("Error in processing files");
  }
});

processingQueue.process(async (job) => {
  const { file, userUID, language, translationId } = job.data;
  const storageDir = `translations/${userUID}`;
  const originalFilePath = `${storageDir}/${file.originalname}`;
  const originalFileRef = bucket.file(originalFilePath);

  try {
    // Save the file to Firebase Storage
    await originalFileRef.save(file.buffer, { contentType: file.mimetype });
    console.log("File uploaded successfully to Firebase Storage.");

    const originalFileUrl = `https://storage.googleapis.com/${bucket.name}/${originalFilePath}`;
    let resultData;

    // Process based on file type
    if (file.mimetype === "application/pdf") {
      resultData = await processPDF(file, userUID, storageDir, bucket);
    } else if (
      [
        "image/png",
        "image/jpeg",
        "image/bmp",
        "image/pbm",
        "image/webp",
      ].includes(file.mimetype)
    ) {
      resultData = await processImageWithTesseract(
        file,
        userUID,
        storageDir,
        bucket
      );
    } else {
      throw new Error("Unsupported file type");
    }

    // Update Firestore document with file processing details
    const translationRef = db.collection("translations").doc(translationId);
    await translationRef.update({
      files: admin.firestore.FieldValue.arrayUnion({
        filename: file.originalname,
        rawFileName: file.originalname.split("_")[1],
        originalFileUrl,
        zipFileUrl: resultData.zipFileUrl,
        textFilePath: resultData.textFilePath,
        textData: resultData.textData,
        pageCount: resultData.pageCount,
      }),
      totalPageCount: admin.firestore.FieldValue.increment(
        resultData.pageCount || 0
      ),
      totalCharCount: admin.firestore.FieldValue.increment(
        resultData.textData.charCountWithoutSpacesAndNumbers || 0
      ),
    });

    const userDocRef = db.doc(`users/${userUID}`);
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists) {
        throw new Error("User does not exist!");
      }
      const translations = userDoc.data().translations || [];
      translations.push(translationRef);
      transaction.update(userDocRef, { translations });
    });

    // Increment queueProgress.completedFiles for each successfully processed file
    await translationRef.update({
      "queueProgress.completedFiles": admin.firestore.FieldValue.increment(1),
    });
  } catch (error) {
    console.error("Error processing file:", error);
    await db.collection("translations").doc(translationId).update({
      status: "failed",
      active: false,
      error: error.message,
    });
  }
});

//NEW WITH TASKS

//NEW WITH TASKS

//OLD

app.post("/uploadExtractPDF2", upload.single("file"), async (req, res) => {
  if (!req.file) {
    console.log("No file uploaded");
    return res.status(400).send("No file uploaded");
  }

  console.log("File received:");
  console.log("Original filename:", req.file.originalname);
  console.log("Mimetype:", req.file.mimetype);
  console.log("File size:", req.file.size);
  console.log("Buffer available:", !!req.file.buffer);

  const userUID = req.file.originalname.split("_")[0];
  if (!userUID || userUID.length === 0) {
    console.log("Invalid or missing User UID");
    return res.status(400).send("Invalid or missing User UID");
  }

  const storageDir = `translations/${userUID}`;

  // Define the path for the original PDF file
  const originalFilePath = `${storageDir}/${req.file.originalname}`;
  const originalFile = bucket.file(originalFilePath);

  // Upload the original PDF file to Firebase Storage
  try {
    await originalFile.save(req.file.buffer, {
      contentType: req.file.mimetype,
    });
    console.log("Original PDF file uploaded successfully to Firebase Storage.");
  } catch (err) {
    console.error(
      "Error uploading original PDF file to Firebase Storage:",
      err
    );
    return res.status(500).send("Error uploading original PDF file");
  }

  try {
    // Create a Service Principal for Adobe PDF services
    const credentials = new ServicePrincipalCredentials({
      clientId: process.env.PDF_SERVICES_CLIENT_ID,
      clientSecret: process.env.PDF_SERVICES_CLIENT_SECRET,
    });
    const pdfServices = new PDFServices({ credentials });

    // Create an asset(s) from the uploaded file using the readStream
    const readStream = Readable.from(req.file.buffer);
    const inputAsset = await pdfServices.upload({
      readStream,
      mimeType: MimeType.PDF,
    });

    // Create parameters for the job and execute the PDF extraction
    const params = new ExtractPDFParams({
      elementsToExtract: [ExtractElementType.TEXT],
    });
    const job = new ExtractPDFJob({ inputAsset, params });
    const pollingURL = await pdfServices.submit({ job });
    const pdfServicesResponse = await pdfServices.getJobResult({
      pollingURL,
      resultType: ExtractPDFResult,
    });

    // Extract the result's content
    const resultAsset = pdfServicesResponse.result.resource;
    const streamAsset = await pdfServices.getContent({ asset: resultAsset });

    // Generate paths for saving files on Firebase Storage
    //const storageDir = `translations/${userUID}`;
    const zipFilePath = `${storageDir}/ExtractedText_${req.file.originalname}.zip`;

    // Upload the zip file to Firebase Storage
    const zipFile = bucket.file(zipFilePath);
    const zipWriteStream = zipFile.createWriteStream({
      metadata: { contentType: "application/zip" },
    });

    streamAsset.readStream.pipe(zipWriteStream);

    zipWriteStream.on("finish", async () => {
      console.log("ZIP file uploaded successfully to Firebase Storage.");

      // Extract text from structuredData.json inside the ZIP file
      const [metadata] = await zipFile.getMetadata();
      const zipFileUrl = `https://storage.googleapis.com/${metadata.bucket}/${metadata.name}`;
      const [zipBuffer] = await zipFile.download();

      try {
        const zip = new AdmZip(zipBuffer);

        // Log all files inside the ZIP
        zip.getEntries().forEach((entry) => {
          console.log("File inside ZIP:", entry.entryName);
        });

        const jsonFile = zip.readAsText("structuredData.json");

        if (!jsonFile) {
          throw new Error("structuredData.json is missing or empty");
        }

        const jsonData = JSON.parse(jsonFile);

        // Extract language and text data from JSON
        const detectedLanguage = jsonData.extended_metadata.language;
        const pagecount = jsonData.extended_metadata.page_count;

        let fullText = jsonData.elements.reduce((acc, element) => {
          return element.Text ? acc + " " + element.Text : acc;
        }, "");

        // Save the extracted text as a TXT file in Firebase Storage
        const textFilePath = `${storageDir}/ExtractedText_${req.file.originalname}.txt`;
        const textFile = bucket.file(textFilePath);
        await textFile.save(fullText.trim(), {
          contentType: "text/plain",
        });

        const pagesData = analyzePages(jsonData);

        const originalFileUrl = `https://storage.googleapis.com/${bucket.name}/${originalFilePath}`;

        const history = [];

        const translationData = {
          active: true,
          userUID: db.doc(`users/${userUID}`),
          filename: req.file.originalname,
          rawFileName: req.file.originalname.split("_")[1],
          originalFileUrl,
          zipFileUrl,
          textFilePath,
          language: jsonData.extended_metadata.language,
          pageCount: jsonData.extended_metadata.page_count,
          pagesData: pagesData,
          status: "waitingoffer",
          createdAt: admin.firestore.Timestamp.now(),
          history: [
            {
              timestamp: admin.firestore.Timestamp.now(),
              description: "Dosya analiz için yüklendi",
              hidden: false,
            },
          ],
        };

        // Save translation data to Firestore
        const translationRef = await db
          .collection("translations")
          .add(translationData);

        // Update user's translation array in Firestore
        const userDocRef = db.doc(`users/${userUID}`);
        await db.runTransaction(async (transaction) => {
          const userDoc = await transaction.get(userDocRef);
          if (!userDoc.exists) {
            throw new Error("User does not exist!");
          }
          const translations = userDoc.data().translations || [];
          translations.push(translationRef);
          transaction.update(userDocRef, { translations });
        });

        res.status(200).json({
          message: "File uploaded and processed successfully",
          translationID: translationRef.id,
          language: detectedLanguage,
        });
      } catch (err) {
        console.error("Error parsing structuredData.json:", err);
        return res.status(500).send("Error processing ZIP file contents");
      }
    });

    zipWriteStream.on("error", (err) => {
      console.error("Error writing the ZIP file to Firebase Storage", err);
      res.status(500).send("Error writing the ZIP file");
    });
  } catch (err) {
    console.error("Exception encountered while executing operation", err);
    res.status(500).send("Error processing PDF extraction");
  }
});

//OLD

app.post("/testupload", upload.single("file"), (req, res) => {
  //const userUID = req.body.UID;

  if (!req.file) {
    console.log("No file uploaded");
    return res.status(400).send("No file uploaded");
  }

  res.status(200).send(`File uploaded successfully: ${req.file.path}`);
});

app.post("/assignTranslation", async (req, res) => {
  try {
    const { userUID, translationID } = req.body;

    if (!userUID || !translationID) {
      console.log("Missing userUID or translationID");

      return res.status(400).send("Missing userUID or translationID");
    }

    // Get the user document reference and their name
    const userRef = db.collection("users").doc(userUID);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.log("User not found");
      return res.status(404).send("User not found");
    }

    const userData = userDoc.data();

    if (userData.userType === "customer") {
      console.log("Müşteriler, tercüme devralamaz");
      return res.status(403).send("Bu işlemi yapmaya izniniz yok.");
    }

    const userFullName = `${userData.name} ${userData.surname}`;

    // Get the translation document reference
    const translationRef = db.collection("translations").doc(translationID);
    const translationDoc = await translationRef.get();

    if (!translationDoc.exists) {
      console.log("Translation document not found");
      return res.status(404).send("Çeviri bulunamadı.");
    }

    const translationData = translationDoc.data();

    if (
      translationData.translator &&
      translationData.translator.translatorRef.id === userUID
    ) {
      console.log(`Bu çeviri zaten ${userFullName}'e ait.`);
      return res.status(400).send("Bu çeviri zaten size atanmış.");
    }

    // Create a new "translator" field as a map in the translation document
    await translationRef.update({
      translator: {
        translatorRef: userRef,
        name: userFullName,
        assignedAt: admin.firestore.Timestamp.now(),
      },
      history: admin.firestore.FieldValue.arrayUnion({
        description: `${userFullName} tercüme'yi devraldı`,
        timestamp: admin.firestore.Timestamp.now(),
        hidden: true,
      }),
    });

    // Update the user document by adding the translation reference to the translations array
    await userRef.update({
      translations: admin.firestore.FieldValue.arrayUnion(translationRef),
    });
    console.error(`${userFullName} ${translationID} ID'li tercüme'yi devraldı`);
    res.status(200).send(`${userFullName} tercüme'yi devraldı`);
  } catch (error) {
    console.error("Error assigning translation:", error);
    res.status(500).send("Error assigning translation");
  }
});
app.post("/cancelTranslation", async (req, res) => {
  const { translationID, userUID } = req.body;

  if (!translationID) {
    console.log("No translationID provided in the request.");
    return res.status(400).send({ error: "translationID is required" });
  }

  if (!userUID) {
    console.log("No userUID provided in the request.");
    return res.status(400).send({ error: "userUID is required" });
  }

  try {
    // Reference the document in the "translations" collection

    const translationRef = db.collection("translations").doc(translationID);

    // Get the current document data
    const doc = await translationRef.get();

    if (!doc.exists) {
      console.log(`Translation with ID ${translationID} not found.`);
      return res.status(404).send({
        error:
          "Yüklediğiniz dosya zaman aşımına uğramıştır. Lütfen işleme tekrardan başlayınız.",
      });
    }

    const userRef = db.collection("users").doc(userUID);

    // Fetch the document
    const userDoc = await userRef.get();

    let userType = "";

    if (userDoc.exists) {
      // Access the 'userType' field
      userType = userDoc.data().userType;
      console.log("User type: ", userType);
    } else {
      console.log(`User with ID ${userUID} not found.`);
      return res.status(404).send({
        error: "Kullanıcı bulunamadı.",
      });
    }

    const translationData = doc.data();
    const currentStatus = translationData.status;

    const isActive = translationData.active;

    const translationOwnerID = translationData.userUID.id;

    if (userType !== "translator" && userUID !== translationOwnerID) {
      console.log(
        `User with ID ${userUID} is not permitted to cancel the translation with ID ${translationID}.`
      );
      return res.status(403).send({
        error: "Bu çeviriyi iptal etme izniniz yok.",
      });
    }

    // Check if the current status is "waitinguserconfirmation"
    if (isActive) {
      const newHistoryEntry = {
        timestamp: admin.firestore.Timestamp.now(),
        description: `Kullanıcı tercümeyi iptal etti.`,
        hidden: false,
      };

      // Update the status of the document
      await translationRef.update({
        status: "canceled",
        canceledAt: admin.firestore.Timestamp.now(),
        history: admin.firestore.FieldValue.arrayUnion(newHistoryEntry),
        active: false,
      });

      console.log(
        `Translation with ID ${translationID}'s status changed from ${currentStatus} to 'canceled'.`
      );
      return res.status(200).json({
        message: "Success",
        redirectUrl: `https://tercumatik-app.web.app/result?event=cancel&type=success`,
      });
    } else {
      console.log(
        `Translation with ID ${translationID} is already not active.`
      );
      res.status(400).send({
        error: "Bu tercüme zaten iptal edilmiştir.",
      });
    }
  } catch (error) {
    console.error(
      `Error canceling the translation with ID ${translationID}:`,
      error
    );
    res
      .status(500)
      .send({ error: "Sistem hatası. Kısa süre içerisinde tekrar deneyiniz" });
  }
});

app.post("/submitforcontrol", async (req, res) => {
  const { translationID } = req.body;

  if (!translationID) {
    console.log("No translationID provided in the request.");
    return res.status(400).send({ error: "translationID is required" });
  }

  try {
    // Reference the document in the "translations" collection
    const translationRef = db.collection("translations").doc(translationID);

    // Get the current document data
    const doc = await translationRef.get();

    if (!doc.exists) {
      console.log(`Translation with ID ${translationID} not found.`);
      return res.status(404).send({
        error:
          "Yüklediğiniz dosya zaman aşımına uğramıştır. Lütfen işleme tekrardan başlayınız.",
      });
    }

    const translationData = doc.data();
    const currentStatus = translationData.status;

    // Check if the current status is "waitinguserconfirmation"
    if (currentStatus === "waitinguserconfirmation") {
      const newHistoryEntry = {
        timestamp: admin.firestore.Timestamp.now(),
        description: `Kullanıcı teklifi kabul etti, dosya çevirmen kontrolü bekliyor`,
        hidden: false,
      };

      // Update the status of the document
      await translationRef.update({
        status: "waitingtranslatorapproval",
        waitingTranslatorApprovalStartedAt: admin.firestore.Timestamp.now(),
        history: admin.firestore.FieldValue.arrayUnion(newHistoryEntry),
      });

      console.log(
        `Translation with ID ${translationID}'s status changed from ${currentStatus} to 'waitingtranslatorapproval'.`
      );
      return res.status(200).json({
        message: "Success",
        redirectUrl: `https://tercumatik-app.web.app/result?event=submitforcontrol&type=success`,
      });
    } else {
      console.log(
        `Translation with ID ${translationID} has status '${currentStatus}', which cannot be updated to 'waitingtranslatorapproval'.`
      );
      res.status(400).send({
        error: "Bu tercüme operasyonu zaten onay için gönderilmiştir.",
      });
    }
  } catch (error) {
    console.error(
      `Error updating status for translation with ID ${translationID}:`,
      error
    );
    res
      .status(500)
      .send({ error: "Sistem hatası. Kısa süre içerisinde tekrar deneyiniz" });
  }
});

const paymentValidationRules = [
  body("cardNumber").isCreditCard().withMessage("Card number is invalid."),
  body("expDate")
    .trim()
    .matches(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/)
    .withMessage("Invalid expiration date. Format MM/YY"),
  body("cvv")
    .isLength({ min: 3, max: 4 })
    .withMessage("CVV must be 3 or 4 digits long."),

  // You can add more rules as needed
];

app.post("/submit-payment", paymentValidationRules, async (req, res) => {
  // Simple validation (You should expand upon this based on your requirements)
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res
      .status(400)
      .json({ errors: errors.array(), validationhatasi: true });
  }

  // Extract and validate data from req.body
  const paymentData = {
    customerUID: req.body.customerUID,
    name: req.body.name,
    surname: req.body.surname,
    email: req.body.email,
    phone: req.body.phone,
    address1: req.body.address1,
    address2: req.body.address2 || "", // Handle optional fields appropriately
    city: req.body.city,
    province: req.body.province || "",
    zip: req.body.zip,
    translationID: req.body.translationID,
    registrationDate: admin.firestore.Timestamp.now(), // Capture the current date as the registration date
    // Initialize amount; will be set after fetching translation price and applying exchange rate
    status: "Pending",
    amount: 0,
    ip: req.ip,
  };

  const translationRef = db
    .collection("translations")
    .doc(req.body.translationID);

  const translationDoc = await translationRef.get();

  if (!translationDoc.exists) {
    return res.status(404).send("Translation Document not found.");
  }
  let fee;
  const translationData = translationDoc.data();

  const rawPrice = translationData.finalamount;

  const userRef = db.collection("users").doc(req.body.customerUID);

  //let extras = 0;
  //
  //if (translationData.depolamaOpt !== undefined) {
  //  extras = extras + translationData.depolamaPrice;
  //}
  //
  //if (translationData.acilOpt !== undefined) {
  //  extras = extras + translationData.acilPrice;
  //}
  //const priceWithExtras = rawPrice + extras;
  //
  //let discountAmount = 0;
  //
  //if (translationData.discount !== undefined) {
  //  discountAmount = (priceWithExtras * translationData.discount) / 100;
  //}
  //
  //const priceWithDiscount = priceWithExtras - discountAmount;
  //
  //const KDV = 0.2;
  //
  //const priceWithKDV = priceWithDiscount + priceWithDiscount * KDV; //Final price

  let percentage = 100;

  let isFirstPayment = true;

  if (!translationData.pesin) {
    if (translationData.status === "waitinguserfirstpayment") {
      isFirstPayment = true;
      percentage = 30;
    }
    if (translationData.status === "waitingusersecondpayment") {
      isFirstPayment = false;
      percentage = 70;
    }
  }

  const finalPrice = (rawPrice / 100) * percentage;

  const newPayment = {
    amount: finalPrice, // Example amount
    createdAt: admin.firestore.Timestamp.now(), // Example date
    status: "pending",
  };

  const newHistoryEntry = {
    timestamp: admin.firestore.Timestamp.now(),
    description: `Kullanıcı ödeme işlemine başladı.`,
    hidden: true,
  };

  const userAddress = `${paymentData.address1}, ${paymentData.zip}, ${paymentData.city}`;

  // Construct the update object conditionally
  const updateData = {
    [isFirstPayment ? "payments.0" : "payments.1"]: newPayment,
    history: admin.firestore.FieldValue.arrayUnion(newHistoryEntry),
    userAddress: userAddress,
  };

  const userUpdateData = {};

  // Conditionally add userAddress if status is "waitinguserfirstpayment"
  //if (translationData.status === "waitinguserfirstpayment") {
  userUpdateData.address = paymentData.address1;
  userUpdateData.postcode = paymentData.zip;
  userUpdateData.city = paymentData.city;
  userUpdateData.fullAddress = userAddress;
  //}

  // Update the document with the constructed data
  await translationRef.update(updateData);

  await userRef.update(userUpdateData);

  // Prepare and execute payment
  const translationID = paymentData.translationID;
  const amount = finalPrice;
  const customerEmail = paymentData.email;
  const customerPhone = paymentData.phone;
  const customerFirstName = paymentData.name;
  const customerLastName = paymentData.surname;
  const customerAddress = `${paymentData.address1} ${paymentData.city}`;
  const cardHolderName = req.body.cardName; // You should get this from your form or user profile
  const cardNumber = req.body.cardNumber; // Same as above
  const [cardExpiryMonth, cardExpiryYear] = req.body.expDate.split("/");
  const cardCVV = req.body.cvv; // Same as above
  const installment = "1"; // If you support installment, this should come from your form/user choice

  const prefix = isFirstPayment ? "TM1" : "TM2";

  let url = `http://api.uguz.net/v1/pos/vpos/index.php?islem=3d&bayikodu=vposhZkJkgWtonY9725E&kullaniciadi=adil.goekdemir@berliner.com.tr&kullanicisifresi=123456&token=${
    prefix + translationID + translationID
  }&kartsahibi=${encodeURIComponent(
    cardHolderName
  )}&kartno=${cardNumber}&kartay=${cardExpiryMonth}&kartyil=${cardExpiryYear}&kartcvv=${cardCVV}&taksit=${installment}&tutar=${amount.toFixed(
    2
  )}&musteriadi=${encodeURIComponent(
    customerFirstName
  )}&musterisoyadi=${encodeURIComponent(
    customerLastName
  )}&musterieposta=${encodeURIComponent(
    customerEmail
  )}&musteritelefon=${encodeURIComponent(
    customerPhone
  )}&musteriil=${encodeURIComponent(
    paymentData.city
  )}&musteriadres=${encodeURIComponent(
    customerAddress
  )}&returnurl=https://api.tercumatik-api.com/payment-notification&nettutar=${(
    amount.toFixed(2) * 0.9601
  ).toFixed(2)}`;

  //console.log("This is the URL: ", url);

  let config = {
    method: "get",
    maxBodyLength: Infinity,
    url: url,
    headers: {},
    data: "", // If your request does not need to send data in the body, this can be an empty string
  };

  axios
    .request(config)
    .then((response) => {
      // Assuming the response is text and contains the 3D Secure URL in the described format
      const responseBody = response.data;
      //console.log(response);
      if (responseBody) {
        res.status(200).json({
          message: "3DS Fetch Successful",
          //docId: registrationStatus.docId,
          paymentLink: responseBody, // This is the extracted 3D Secure URL
        });
      } else {
        // If the URL can't be extracted, respond with an error or a fallback action

        console.log("URL NOT Found");

        res.status(500).json({
          message: "3D Secure URL could not be extracted.",
          //error: response,
        });
      }
    })
    .catch((error) => {
      // Handle errors from the payment gateway request
      console.log("Error with the request");

      console.error("Payment gateway request failed:", error);
      res.status(500).json({
        message: "Failed to make payment gateway request",
        error: error.message,
      });
    });
});

app.post("/payment-notification", async (req, res) => {
  const orderRef = req.body.ORDER_REF_NUMBER;

  // Remove the first 3 characters
  const isFirstPayment = orderRef[2] === "1" ? true : false;

  const trimmedRef = orderRef.substring(3);

  // Since the remaining string is double, divide it by 2 to get one part
  const halfLength = trimmedRef.length / 2;
  const extractedPart = trimmedRef.substring(0, halfLength);

  const translationID = extractedPart;
  const paymentStatus = req.body.STATUS;
  const paymentMessage = req.body.RETURN_MESSAGE_TR;

  console.log("translationID: " + translationID);

  console.log("isFirstPayment: " + isFirstPayment);

  console.log("status: " + paymentStatus);

  console.log("paymentMessage: " + paymentMessage);

  let newHistoryEntry = {};

  if (paymentStatus && translationID) {
    const translationRef = db.collection("translations").doc(translationID);
    const translationDoc = await translationRef.get();

    try {
      if (!translationDoc.exists) {
        console.log(
          "No such translation document with the ID: ",
          translationID
        );
        return res.redirect(
          `https://tercumatik-app.web.app/result?event=translationstart&type=failure&msg=${encodeURIComponent(
            paymentMessage
          )}`
        );
      }

      const translationData = translationDoc.data();

      const isPesin = translationData.pesin;

      const finalamount = translationData.finalamount;

      const now = new Date();
      let expiryDate;

      const paidAmount =
        isPesin && isFirstPayment
          ? finalamount
          : isFirstPayment && !isPesin
          ? (finalamount / 10) * 3
          : !isFirstPayment && !isPesin
          ? (finalamount / 10) * 7
          : 0; // Default to 0 if none of the conditions match

      // Check if paymentStatus is already "Paid"
      if (isFirstPayment && translationData.payments["0"].status === "paid") {
        console.log(
          `Translation ${translationID}'s first payment is already marked as paid.`
        );
        return res.redirect(
          `https://tercumatik-app.web.app/result?event=translationstart&type=success&msg=${encodeURIComponent(
            paymentMessage
          )}`
        );
      } else if (
        !isFirstPayment &&
        translationData.payments["1"].status === "paid"
      ) {
        console.log(
          `Translation ${translationID}'s second payment is already marked as paid.`
        );
        return res.redirect(
          `https://tercumatik-app.web.app/result?event=translationend&type=success&msg=${encodeURIComponent(
            paymentMessage
          )}`
        );
      }

      // Proceed to create a student and update the exam if the payment was successful
      if (paymentStatus === "SUCCESS") {
        console.log("Payment success!");
        if (isFirstPayment) {
          console.log("Payment: first");
          await translationRef.update({
            "payments.0.amount": paidAmount,
            "payments.0.status": "paid",
            "payments.0.timestamp": admin.firestore.Timestamp.now(),
            //expiryDate: admin.firestore.Timestamp.fromDate(expiryDate), // Set expiry date
            status: "translatortranslating",
            waitingTranslatorTranslatingStartedAt:
              admin.firestore.Timestamp.now(),
            history: admin.firestore.FieldValue.arrayUnion({
              description: "İlk ödeme tamamlandı, tercüme işlemine başlanıyor.",
              hidden: false,
              timestamp: admin.firestore.Timestamp.now(),
            }),
          });

          return res.redirect(
            `https://tercumatik-app.web.app/result?event=translationstart&type=success&msg=${encodeURIComponent(
              paymentMessage
            )}`
          );
        } else {
          console.log("Payment: second");

          const now = new Date();
          let expiryDate;

          if (translationData.depolamaOpt) {
            // If depolamaOpt exists, add that many months
            expiryDate = new Date(
              now.setMonth(now.getMonth() + Number(translationData.depolamaOpt))
            );
          } else {
            // If depolamaOpt does not exist, set expiryDate to 7 days from now
            expiryDate = new Date(now.setDate(now.getDate() + 7));
          }

          await translationRef.update({
            "payments.1.amount": paidAmount,
            "payments.1.status": "paid",
            "payments.1.timestamp": admin.firestore.Timestamp.now(),
            expiryDate: admin.firestore.Timestamp.fromDate(expiryDate), // Set expiry date
            status: "completed",
            completedAt: admin.firestore.Timestamp.now(),
            history: admin.firestore.FieldValue.arrayUnion({
              description:
                "İkinci ödeme tamamlandı, dosya kullanıcıya iletiliyor.",
              hidden: false,
              timestamp: admin.firestore.Timestamp.now(),
            }),
          });
          return res.redirect(
            `https://tercumatik-app.web.app/result?event=translationend&type=success&msg=${encodeURIComponent(
              paymentMessage
            )}`
          );
        }
      } else {
        console.log(
          "Payment status is not success. Payment Status: " + paymentStatus
        );
        console.log("Payment message: " + paymentMessage);

        if (isFirstPayment) {
          console.log("Payment: first");
          await translationRef.update({
            "payments.0.status": "failed",
            "payments.0.timestamp": admin.firestore.Timestamp.now(),
            history: admin.firestore.FieldValue.arrayUnion({
              description: "İlk ödeme başarısız. Sebep: " + paymentMessage,
              hidden: false,
              timestamp: admin.firestore.Timestamp.now(),
            }),
          });
          return res.redirect(
            `https://tercumatik-app.web.app/result?event=translationstart&type=failure&msg=${encodeURIComponent(
              paymentMessage
            )}`
          );
        } else {
          console.log("Payment: second");
          await translationRef.update({
            "payments.1.status": "failed",
            "payments.1.timestamp": admin.firestore.Timestamp.now(),
            history: admin.firestore.FieldValue.arrayUnion({
              description: "İkinci ödeme başarısız. Sebep: " + paymentMessage,
              hidden: false,
              timestamp: admin.firestore.Timestamp.now(),
            }),
          });
          return res.redirect(
            `https://tercumatik-app.web.app/result?event=translationend&type=failure&msg=${encodeURIComponent(
              paymentMessage
            )}`
          );
        }
      }
    } catch (error) {
      console.log("Error occured: " + error);
      if (isFirstPayment) {
        await translationRef.update({
          "payments.0.status": "failed",
          "payments.0.timestamp": admin.firestore.Timestamp.now(),
          history: admin.firestore.FieldValue.arrayUnion({
            description: "İlk ödeme başarısız. Sebep: " + error,
            hidden: false,
            timestamp: admin.firestore.Timestamp.now(),
          }),
        });
        return res.redirect(
          `https://tercumatik-app.web.app/result?event=translationstart&type=failure&msg=${encodeURIComponent(
            paymentMessage
          )}`
        );
      } else {
        await translationRef.update({
          "payments.1.status": "failed",
          "payments.1.timestamp": admin.firestore.Timestamp.now(),
          history: admin.firestore.FieldValue.arrayUnion({
            description: "İkinci ödeme başarısız. Sebep: " + error,
            hidden: false,
            timestamp: admin.firestore.Timestamp.now(),
          }),
        });
        return res.redirect(
          `https://tercumatik-app.web.app/result?event=translationend&type=failure&msg=${encodeURIComponent(
            paymentMessage
          )}`
        );
      }
    }
  } else {
    console.log("No translationID or paymentStatus have been found!");

    const systemFailureMessage =
      "Bir sistem arızası oluştu, lütfen tekrar deneyiniz.";

    if (isFirstPayment) {
      return res.redirect(
        `https://tercumatik-app.web.app/result?event=translationstart&type=failure&msg=${encodeURIComponent(
          systemFailureMessage
        )}`
      );
    } else {
      return res.redirect(
        `https://tercumatik-app.web.app/result?event=translationend&type=failure&msg=${encodeURIComponent(
          systemFailureMessage
        )}`
      );
    }
  }
});

app.post("/goToPayment", async (req, res) => {
  try {
    const translationID = req.body.translationID;
    const depolamaOpt = req.body.depolamaOpt || "";
    const acilOpt = req.body.acilOpt || "";
    const userUID = req.body.userUID;
    const kargo = req.body.kargoSelected;
    const pesin = req.body.pesinSelected;

    if (!translationID || !userUID) {
      console.log("Missing required parameters: translationID or userUID.");
      res.status(400).send("Hata: Eksik parametreler.");
      return;
    }

    console.log("request: ");

    console.log(req.body);

    let finalamount = 0;

    const translationdocRef = db.collection("translations").doc(translationID);

    // Fetch the document
    const translationdoc = await translationdocRef.get();
    if (!translationdoc.exists) {
      console.log(
        `Error: Translation document with ID ${translationID} not found.`
      );
      res.status(404).send("Veritabanı hatası. Couldn't find translation.");
      return;
    }

    const translationData = translationdoc.data();

    if (!translationData.userUID || translationData.userUID.id !== userUID) {
      console.log(
        `Permission error: User ${userUID} is not authorized to modify translation ${translationID}.`
      );
      res
        .status(403)
        .send("İzin hatası. Kullanıcı'nın bu eylemi gerçekleştirme izni yok.");
      return;
    }

    const newHistoryEntries = [];

    let depolamaPrice = 0;

    let acilPrice = 0;

    // Handling depolama option
    if (depolamaOpt !== "") {
      try {
        const depolamadocRef = db
          .collection("fiyatlar")
          .doc("depolamafiyatlari");
        const depolamaData = await depolamadocRef
          .get()
          .then((doc) => doc.data());

        if (!depolamaData || !depolamaData[depolamaOpt]) {
          console.log(`Depolama option ${depolamaOpt} not found in fiyatlar.`);
          res.status(404).send("Depolama seçeneği bulunamadı.");
          return;
        }

        depolamaPrice = depolamaData[depolamaOpt];
        //finalamount = finalamount + depolamaPrice;

        console.log(
          `Depolama servisi eklendi: ${depolamaOpt} ay ${depolamaPrice}₺`
        );

        newHistoryEntries.push({
          description: `Depolama servisi eklendi: ${depolamaOpt} ay ${depolamaPrice}₺`,
          hidden: false,
          timestamp: admin.firestore.Timestamp.now(),
        });
      } catch (error) {
        console.log(`Error fetching depolama fiyatları: ${error.message}`);
        res
          .status(500)
          .send("Depolama fiyatları veritabanından alınırken hata oluştu.");
        return;
      }
    }

    // Handling acil option
    if (acilOpt !== "") {
      try {
        const acildocRef = db.collection("fiyatlar").doc("acilfiyatlari");
        const acilData = await acildocRef.get().then((doc) => doc.data());

        if (!acilData || !acilData[acilOpt]) {
          console.log(`Acil option ${acilOpt} not found in fiyatlar.`);
          res.status(404).send("Acil seçeneği bulunamadı.");
          return;
        }

        acilPrice = acilData[acilOpt];
        //finalamount = finalamount + acilPrice;

        console.log(`Acil servisi eklendi: ${acilOpt} saat ${acilPrice}₺`);

        newHistoryEntries.push({
          description: `Acil servisi eklendi: ${acilOpt} saat ${acilPrice}₺`,
          hidden: false,
          timestamp: admin.firestore.Timestamp.now(),
        });
      } catch (error) {
        console.log(`Error fetching acil fiyatları: ${error.message}`);
        res
          .status(500)
          .send("Acil fiyatları veritabanından alınırken hata oluştu.");
        return;
      }
    }

    const KDV = 0.2;

    const calculatedRawPrice =
      translationData.karakterUcreti + acilPrice + depolamaPrice;

    let calculatedDiscountAmount = 0;

    let calculatedDiscountedPrice = calculatedRawPrice;

    if (translationData.discount && translationData.discount > 0) {
      // Code to execute if discount exists and is greater than 0
      calculatedDiscountAmount =
        calculatedRawPrice * (translationData.discount / 100);
      console.log(
        `Discount Amount (rawPrice * discount): ${calculatedRawPrice} * ${translationData.discount}% = ${calculatedDiscountAmount}`
      );
      // Step 3: Calculate discountedPrice
      calculatedDiscountedPrice = calculatedRawPrice - calculatedDiscountAmount;
      console.log(
        `Discounted Price (rawPrice - discountAmount): ${calculatedRawPrice} - ${calculatedDiscountAmount} = ${calculatedDiscountedPrice}`
      );
    }

    const calculatedTaxAmount = calculatedDiscountedPrice * KDV;

    console.log(
      `Tax Amount (discountedPrice * tax): ${calculatedDiscountedPrice} * 20% = ${calculatedTaxAmount}`
    );

    const calculatedTotalPrice =
      calculatedDiscountedPrice +
      calculatedTaxAmount +
      translationData.toplamOnayUcreti;
    console.log(
      `Total Price (discountedPrice + taxAmount + toplam onay ücreti): ${calculatedDiscountedPrice} + ${calculatedTaxAmount} + ${translationData.toplamOnayUcreti} = ${calculatedTotalPrice}`
    );

    // Add the final history entry
    newHistoryEntries.push({
      description: `Kullanıcı ${calculatedTotalPrice.toFixed(
        2
      )} (20% KDV dahil) teklifi kabul etti, ödemeye yönlendiriliyor.`,
      hidden: false,
      timestamp: admin.firestore.Timestamp.now(),
    });

    const updateData = {
      KDVUcreti: calculatedTaxAmount,
      indirimTutari: calculatedDiscountAmount,
      finalamount: parseFloat(calculatedTotalPrice.toFixed(2)),
      //waitingTranslationStartedAt: admin.firestore.Timestamp.now(),
      history: admin.firestore.FieldValue.arrayUnion(...newHistoryEntries),
    };

    if (depolamaOpt !== "") {
      updateData.depolamaOpt = depolamaOpt;
      updateData.depolamaPrice = parseFloat(depolamaPrice.toFixed(2));
    }

    if (acilOpt !== "") {
      updateData.acilOpt = acilOpt;
      updateData.acilPrice = parseFloat(acilPrice.toFixed(2));
    }

    updateData.kargo = kargo;

    updateData.pesin = pesin;

    //console.log(updateData);

    // Update the translation document
    try {
      await translationdocRef.update(updateData);
    } catch (error) {
      console.log(
        `Error updating translation document ${translationID}: ${error.message}`
      );
      res.status(500).send("Veritabanı güncellenirken bir hata oluştu.");
      return;
    }

    // Send the data as response
    res.status(200).json({
      status: "ok",
    });
  } catch (error) {
    console.log(`Unexpected error: ${error.message}`);
    res.status(500).send("Beklenmeyen bir hata oluştu.");
  }
});

//new reoffer
app.post("/recalculate", async (req, res) => {
  try {
    const recalculateData = {
      translationID: req.body.translationID,
      translationName: req.body.translationName,
      spesifikOnay: req.body.spesifikOnay,
      noterOnay: req.body.noterOnay,
      apostilleOnay: req.body.apostilleOnay,
      kaymakamValilikOnay: req.body.kaymakamValilikOnay,
      disisleriOnay: req.body.disisleriOnay,
      elcilikKonsoloslukOnay: req.body.elcilikKonsoloslukOnay,
      almanyaOnay: req.body.almanyaOnay,
      adliBilirKisiOnay: req.body.adliBilirKisiOnay,
      targetLanguage: req.body.targetLanguage,
      language: req.body.detectedLanguage,
    };

    console.log("Translation ID: ", recalculateData.translationID);

    const translationdocRef = db
      .collection("translations")
      .doc(recalculateData.translationID);

    // Fetch the translation document
    const translationdoc = await translationdocRef.get();

    if (!translationdoc.exists) {
      res.status(404).send("Veritabanı hatası. Çeviri bulunamadı.");
      return;
    }

    const translationdata = translationdoc.data();

    const userdocRef = db.collection("users").doc(translationdata.userUID.id);

    const userdoc = await userdocRef.get();

    if (!userdoc.exists) {
      res.status(404).send("Veritabanı hatası. Böyle bir kullanıcı yok.");
      return;
    }

    const userdata = userdoc.data();

    const discount = userdata.discount || 0;

    // Normalize language codes
    const normalizeLanguageCode = (lang) => {
      const codeMap = {
        gb: "en",
        ir: "fa",
        be: "fl",
        dk: "da",
        se: "sv",
        rs: "sr",
        tm: "tk",
        si: "sl",
        il: "he",
      };
      return codeMap[lang] || lang;
    };

    // Apply normalization to both original and target languages
    const originalLang = normalizeLanguageCode(recalculateData.language);
    const targetLanguage = normalizeLanguageCode(
      recalculateData.targetLanguage
    );

    // Check for changes in fields that affect pricing
    const fieldsToCompare = [
      "spesifikOnay",
      "noterOnay",
      "apostilleOnay",
      "kaymakamValilikOnay",
      "disisleriOnay",
      "elcilikKonsoloslukOnay",
      "almanyaOnay",
      "adliBilirKisiOnay",
      "targetLanguage",
    ];

    let changesDetected = false;

    for (const field of fieldsToCompare) {
      const newValue = recalculateData[field];
      const oldValue = translationdata[field];

      if (newValue !== oldValue) {
        changesDetected = true;
        break;
      }
    }

    if (!changesDetected) {
      res.status(200).json({
        message: "No changes detected. Recalculation not necessary.",
      });
      return;
    }

    const files = translationdata.files;

    // Calculate total character count
    let totalCharCount = 0;
    Object.keys(files).forEach((fileKey) => {
      const fileData = files[fileKey].textData;
      totalCharCount += fileData.charCountWithoutSpacesAndNumbers;
    });

    const spesifikPrefix = recalculateData.spesifikOnay ? "-S" : "";

    // Fetch birim fiyat
    const birimcode1 = `${originalLang}-${targetLanguage}${spesifikPrefix}`;
    const birimcode2 = `${targetLanguage}-${originalLang}${spesifikPrefix}`;

    const birimdocRef = db.collection("fiyatlar").doc("birimfiyatlari");
    const birimdoc = await birimdocRef.get();

    if (!birimdoc.exists) {
      res.status(404).send("Veritabanı hatası. Birim fiyatlara ulaşılamıyor.");
      return;
    }

    const birimdata = birimdoc.data();

    let birimfiyat;
    let usedcode;

    if (birimcode1 in birimdata) {
      birimfiyat = birimdata[birimcode1];
      console.log(`Value for ${birimcode1}:`, birimfiyat);
      usedcode = birimcode1;
    } else if (birimcode2 in birimdata) {
      birimfiyat = birimdata[birimcode2];
      console.log(`Value for ${birimcode2}:`, birimfiyat);
      usedcode = birimcode2;
    } else {
      console.log(
        `Neither field ${birimcode1} nor ${birimcode2} exists in the document.`
      );
      res.status(404).send("From/To language bulunamadı hatası.");
      return;
    }

    // Fix totalCharCount to 1000 if less than 1000
    const realTotalCharCount = totalCharCount;
    if (totalCharCount < 1000) {
      totalCharCount = 1000;
    }

    // Calculate karakter ücreti
    const karakterUcreti = totalCharCount * birimfiyat;

    console.log(
      `Karakter Ücreti : (toplam karakter sayısı) ${totalCharCount} x (${usedcode} birim fiyatı) ${birimfiyat} = ${karakterUcreti.toFixed(
        2
      )}`
    );

    // Fetch onay prices
    const onaydocRef = db.collection("fiyatlar").doc("onayfiyatlari");
    const onaydoc = await onaydocRef.get();

    if (!onaydoc.exists) {
      res.status(404).send("Veritabanı hatası. Onay Fiyatlarına ulaşılamıyor.");
      return;
    }

    const onaydata = onaydoc.data();

    const apostilleOnayFiyat = onaydata.apostilleOnay;
    const kaymakamValilikFiyat = onaydata.kaymakamValilikOnay;
    const disisleriFiyat = onaydata.disisleriOnay;
    const elcilikKonsoloslukFiyat = onaydata.elcilikKonsoloslukOnay;
    const almanyaFiyat = onaydata.almanyaOnay;
    const adliBilirKisiFiyat = onaydata.adliBilirKisiOnay * 33; // Multiply by current Euro rate
    const noterbirimFiyat = onaydata.noterbirim;
    const notersabitFiyat = onaydata.notersabit;

    // Calculate onay prices
    let toplamOnayUcreti = 0;
    let feeDescriptions = [];
    let onaylar = {};
    let clientOnaylar = {};

    // Calculate noter price
    let noterUcreti = 0;

    if (recalculateData.noterOnay) {
      noterUcreti = notersabitFiyat + totalCharCount * noterbirimFiyat;

      console.log(
        `Noter Ücreti : (Noter Sabit Fiyat) ${notersabitFiyat} + ((toplam karakter sayısı) ${totalCharCount} x (Noter Birim Fiyat) ${noterbirimFiyat}) = ${noterUcreti.toFixed(
          2
        )}`
      );
      onaylar["noterOnay"] = noterUcreti;
      clientOnaylar["Noter Onayı*: "] = noterUcreti;
    }

    if (recalculateData.apostilleOnay) {
      toplamOnayUcreti += apostilleOnayFiyat;
      feeDescriptions.push(`(Apostille Onay) ${apostilleOnayFiyat}`);
      onaylar["apostilleOnay"] = apostilleOnayFiyat;
      clientOnaylar["Apostille Onayı: "] = apostilleOnayFiyat;
    }
    if (recalculateData.kaymakamValilikOnay) {
      toplamOnayUcreti += kaymakamValilikFiyat;
      feeDescriptions.push(`(Kaymakam Valilik Onay) ${kaymakamValilikFiyat}`);
      onaylar["kaymakamValilikOnay"] = kaymakamValilikFiyat;
      clientOnaylar["Kaymakam Valilik Onayı: "] = kaymakamValilikFiyat;
    }
    if (recalculateData.disisleriOnay) {
      toplamOnayUcreti += disisleriFiyat;
      feeDescriptions.push(`(Dışişleri Onay) ${disisleriFiyat}`);
      onaylar["disisleriOnay"] = disisleriFiyat;
      clientOnaylar["Dışişleri Onayı: "] = disisleriFiyat;
    }
    if (recalculateData.elcilikKonsoloslukOnay) {
      toplamOnayUcreti += elcilikKonsoloslukFiyat;
      feeDescriptions.push(
        `(Elçilik Konsolosluk Onay) ${elcilikKonsoloslukFiyat}`
      );
      onaylar["elcilikKonsoloslukOnay"] = elcilikKonsoloslukFiyat;
      clientOnaylar["Elçilik Konsolosluk Onayı: "] = elcilikKonsoloslukFiyat;
    }
    if (recalculateData.almanyaOnay) {
      toplamOnayUcreti += almanyaFiyat;
      feeDescriptions.push(`(Almanya Onay) ${almanyaFiyat}`);
      onaylar["almanyaOnay"] = almanyaFiyat;
      clientOnaylar["Almanya Onayı: "] = almanyaFiyat;
    }
    if (recalculateData.adliBilirKisiOnay) {
      toplamOnayUcreti += adliBilirKisiFiyat;
      feeDescriptions.push(`(Adli Bilirkişi Onay) ${adliBilirKisiFiyat}`);
      onaylar["adliBilirKisiOnay"] = adliBilirKisiFiyat;
      clientOnaylar["Adli Bilirkişi Onayı: "] = adliBilirKisiFiyat;
    }

    console.log(
      "Onay Ücretleri: " +
        feeDescriptions.join(" + ") +
        ` = ${toplamOnayUcreti}`
    );

    // Calculate discount and KDV
    const KDV = 0.2;
    let indirimTutari = 0;

    if (discount > 0) {
      indirimTutari = karakterUcreti * (discount / 100);
    }

    const KDVUcreti = (karakterUcreti - indirimTutari) * KDV;

    let finalamount =
      karakterUcreti + toplamOnayUcreti + KDVUcreti - indirimTutari;

    console.log(
      `(Karakter Ücreti): ${karakterUcreti.toFixed(
        2
      )}, (Noter Ücreti): ${noterUcreti.toFixed(
        2
      )}, (Onay Ücretleri): ${toplamOnayUcreti.toFixed(2)}`
    );

    finalamount = parseFloat(finalamount.toFixed(2));

    // Create history entry in Turkish
    let historyDescription = `Çeviri güncellendi. Yeni fiyat: ${finalamount} TL. `;
    historyDescription += `Karakter Ücreti: ${karakterUcreti.toFixed(2)} TL, `;
    if (noterUcreti > 0) {
      historyDescription += `Noter Ücreti: ${noterUcreti.toFixed(2)} TL, `;
    }
    if (toplamOnayUcreti > 0) {
      historyDescription += `Onay Ücretleri: ${toplamOnayUcreti.toFixed(
        2
      )} TL, `;
    }
    if (indirimTutari > 0) {
      historyDescription += `İndirim Tutarı (${discount}%): ${indirimTutari.toFixed(
        2
      )} TL, `;
    }
    historyDescription += `KDV (%${KDV * 100}): ${KDVUcreti.toFixed(2)} TL.`;

    const newHistoryEntry = {
      timestamp: admin.firestore.Timestamp.now(),
      description: historyDescription,
      hidden: false,
    };

    // Update the translation document
    await translationdocRef.update({
      translationName: recalculateData.translationName,
      discount: discount,
      onaylar: onaylar,
      finalamount: finalamount,
      karakterUcreti: parseFloat(karakterUcreti.toFixed(2)),
      noterUcreti: parseFloat(noterUcreti.toFixed(2)),
      toplamOnayUcreti: parseFloat(toplamOnayUcreti.toFixed(2)),
      KDVUcreti: parseFloat(KDVUcreti.toFixed(2)),
      indirimTutari: parseFloat(indirimTutari.toFixed(2)),
      clientOnaylar: clientOnaylar,
      targetLanguage: targetLanguage,
      language: originalLang,
      history: admin.firestore.FieldValue.arrayUnion(newHistoryEntry),
      //approved: false, // Since this is just recalculating, not approving
    });

    // Send the data as response
    res.status(200).json({
      discount: discount,
      finalamount: finalamount,
      karakterUcreti: parseFloat(karakterUcreti.toFixed(2)),
      noterUcreti: parseFloat(noterUcreti.toFixed(2)),
      toplamOnayUcreti: parseFloat(toplamOnayUcreti.toFixed(2)),
      KDVUcreti: parseFloat(KDVUcreti.toFixed(2)),
      indirimTutari: parseFloat(indirimTutari.toFixed(2)),
      clientOnaylar: clientOnaylar,
      translationID: recalculateData.translationID,
    });
  } catch (error) {
    console.error("Error in recalculate endpoint:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/approveTranslation", async (req, res) => {
  try {
    const approvalData = {
      translationID: req.body.translationID,
      reOfferTranslatorName: req.body.reOfferTranslatorName,
    };

    console.log("Translation ID: ", approvalData.translationID);

    const translationdocRef = db
      .collection("translations")
      .doc(approvalData.translationID);

    // Fetch the translation document
    const translationdoc = await translationdocRef.get();

    if (!translationdoc.exists) {
      res.status(404).send("Veritabanı hatası. Çeviri bulunamadı.");
      return;
    }

    const translationdata = translationdoc.data();

    const userdocRef = db.collection("users").doc(translationdata.userUID.id);

    const userdoc = await userdocRef.get();

    if (!userdoc.exists) {
      res.status(404).send("Veritabanı hatası. Böyle bir kullanıcı yok.");
      return;
    }

    const userdata = userdoc.data();

    const userEmail = userdata.email;
    const userName = userdata.name;
    const userSurname = userdata.surname;
    const userPhone = userdata.phone;

    const newStatus = "waitinguserfirstpayment";

    console.log(`${approvalData.reOfferTranslatorName} teklifi onayladı.`);

    const historyEntry = {
      timestamp: admin.firestore.Timestamp.now(),
      description: `${approvalData.reOfferTranslatorName} teklifi onayladı.`,
      hidden: false,
    };

    // Create a custom token for the user (if needed)
    const customToken = await admin
      .auth()
      .createCustomToken(translationdata.userUID.id);

    // Send email notification to the user
    try {
      await sendTeklifOnayMail(
        approvalData.translationID,
        translationdata.finalamount,
        userEmail,
        customToken
      );
      console.log(
        "Email notification sent successfully from approveTranslation."
      );
    } catch (error) {
      console.error(
        "Failed to send email notification from approveTranslation:",
        error
      );
      res.status(500).json({
        error: "Mail error",
      });
      return;
    }

    // Update the translation document
    await translationdocRef.update({
      status: newStatus,
      waitingUserFirstPaymentStartedAt: admin.firestore.Timestamp.now(),
      history: admin.firestore.FieldValue.arrayUnion(historyEntry),
      approved: true,
    });

    // Send the data as response
    res.status(200).json({
      translationID: approvalData.translationID,
      message: "Translation approved successfully.",
    });
  } catch (error) {
    console.error("Error in approveTranslation endpoint:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/getoffer", async (req, res) => {
  //declare final amount
  let finalamount = 0;

  //ADLİ BİLİR KİŞİ EURO OLARAK GELMEKTEDİR. GÜNCEL KUR İLE ÇARPILMASI GEREKMEKTEDİR

  try {
    //ADLİ BİLİR KİŞİ EURO OLARAK GELMEKTEDİR. GÜNCEL KUR İLE ÇARPILMASI GEREKMEKTEDİR

    const offerData = {
      translationName: req.body.translationName,
      spesifikOnay: req.body.spesifikOnay,
      noterOnay: req.body.noterOnay,
      apostilleOnay: req.body.apostilleOnay,
      kaymakamValilikOnay: req.body.kaymakamValilikOnay,
      disisleriOnay: req.body.disisleriOnay,
      elcilikKonsoloslukOnay: req.body.elcilikKonsoloslukOnay,
      almanyaOnay: req.body.almanyaOnay,
      adliBilirKisiOnay: req.body.adliBilirKisiOnay, // ADLİ BİLİR KİŞİ EURO OLARAK GELMEKTEDİR. GÜNCEL KUR İLE ÇARPILMASI GEREKMEKTEDİR
      detectedLanguage: req.body.detectedLanguage,
      targetLanguage: req.body.targetLanguage,
      // charCount: req.body.charCount,
      userUID: req.body.userUID,
      // pagecount: req.body.pagecount,
      translationID: req.body.translationID,
      isReOffer: req.body.isReOffer || false,
      reOfferTranslatorName: req.body.reOfferTranslatorName || null,
      reOfferPrice: req.body.reOfferPrice || null,
    };

    console.log("Translation ID: ", offerData.translationID);

    console.log("Is Reoffer: ", offerData.isReOffer);

    console.log("Reoffer Price: ", offerData.reOfferPrice);

    if (offerData.reOfferPrice === 0) {
      return;
    }

    const translationdocRef = db
      .collection("translations")
      .doc(offerData.translationID);

    // Fetch the document
    const translationdoc = await translationdocRef.get();

    if (!translationdoc.exists) {
      res.status(404).send("Veritabanı hatası. Couldn't find translation.");
      return;
    }

    const translationdata = translationdoc.data();

    const userdocRef = db.collection("users").doc(translationdata.userUID.id);

    const userdoc = await userdocRef.get();

    if (!userdoc.exists) {
      res.status(404).send("Veritabanı hatası. Böyle bir kullanıcı yok.");
      return;
    }

    const userdata = userdoc.data();

    const discount = userdata.discount || 0;

    const userName = userdata.name;

    const userSurname = userdata.surname;

    const userEmail = userdata.email;

    const userPhone = userdata.phone;

    let newStatus = "";

    if (
      offerData.isReOffer &&
      offerData.reOfferPrice === translationdata.finalamount
    ) {
      //Hiçbir değişiklik yapılmadan teklif onaylandı ise

      // Yani: Tercüman bir değişiklik yapmayıp sadece teklifi onayladı ise
      console.log(`${offerData.reOfferTranslatorName} teklifi onayladı.`);
      const earlyHistoryEntry = {
        timestamp: admin.firestore.Timestamp.now(),
        description: `${offerData.reOfferTranslatorName} teklifi onayladı.`,
        hidden: false,
      };

      newStatus = "waitinguserfirstpayment";

      const customToken = await admin
        .auth()
        .createCustomToken(translationdata.userUID.id);

      try {
        await sendTeklifOnayMail(
          offerData.translationID,
          offerData.reOfferPrice,
          userEmail,
          customToken
        );
        console.log("Email notification sent successfully from getOffer.");
      } catch (error) {
        console.error(
          "Failed to send email notification from getOffer:",
          error
        );
        // Additional error handling, like retrying or logging to an external service
        res.status(500).json({
          error: "Mail error",
        });
        return;
      }

      await translationdocRef.update({
        //onayUcretleriString: onayUcretleriString,
        status: newStatus,
        waitingUserFirstPaymentStartedAt: admin.firestore.Timestamp.now(),
        history: admin.firestore.FieldValue.arrayUnion(earlyHistoryEntry),
      });

      // Send the data as response
      res.status(200).json({
        translationID: offerData.translationID,
      });
      return;
    }

    console.log(offerData.detectedLanguage);

    if (offerData.detectedLanguage === "gb") {
      offerData.detectedLanguage = "en";
    } else if (offerData.detectedLanguage === "ir") {
      offerData.detectedLanguage = "fa";
    } else if (offerData.detectedLanguage === "be") {
      offerData.detectedLanguage = "fl";
    } else if (offerData.detectedLanguage === "dk") {
      offerData.detectedLanguage = "da";
    } else if (offerData.detectedLanguage === "se") {
      offerData.detectedLanguage = "sv";
    } else if (offerData.detectedLanguage === "rs") {
      offerData.detectedLanguage = "sr";
    } else if (offerData.detectedLanguage === "tm") {
      offerData.detectedLanguage = "tk";
    } else if (offerData.detectedLanguage === "si") {
      offerData.detectedLanguage = "sl";
    } else if (offerData.detectedLanguage === "il") {
      offerData.detectedLanguage = "he";
    }

    if (offerData.targetLanguage === "gb") {
      offerData.targetLanguage = "en";
    } else if (offerData.targetLanguage === "ir") {
      offerData.targetLanguage = "fa";
    } else if (offerData.targetLanguage === "be") {
      offerData.targetLanguage = "fl";
    } else if (offerData.targetLanguage === "dk") {
      offerData.targetLanguage = "da";
    } else if (offerData.targetLanguage === "se") {
      offerData.targetLanguage = "sv";
    } else if (offerData.targetLanguage === "rs") {
      offerData.targetLanguage = "sr";
    } else if (offerData.targetLanguage === "tm") {
      offerData.targetLanguage = "tk";
    } else if (offerData.targetLanguage === "si") {
      offerData.targetLanguage = "sl";
    } else if (offerData.targetLanguage === "il") {
      offerData.targetLanguage = "he";
    }

    // Reference to the document
    const onaydocRef = db.collection("fiyatlar").doc("onayfiyatlari");

    // Fetch the document
    const onaydoc = await onaydocRef.get();

    if (!onaydoc.exists) {
      res.status(404).send("Veritabanı hatası. Onay Fiyatlarına ulaşılamıyor.");
      return;
    }

    // Preparation stage
    const onaydata = onaydoc.data();

    const apostilleOnayFiyat = onaydata.apostilleOnay;
    const kaymakamValilikFiyat = onaydata.kaymakamValilikOnay;
    const disisleriFiyat = onaydata.disisleriOnay;
    const elcilikKonsoloslukFiyat = onaydata.elcilikKonsoloslukOnay;
    const almanyaFiyat = onaydata.almanyaOnay;
    const adliBilirKisiFiyat = onaydata.adliBilirKisiOnay * 33; //TODO: EURO İLE ÇARP
    const noterbirimFiyat = onaydata.noterbirim;
    const notersabitFiyat = onaydata.notersabit;

    const originalLang = translationdata.language;
    const targetLang = offerData.targetLanguage;
    const pageCount = translationdata.totalPageCount;
    const files = translationdata.files;

    //getting the user info

    let totalCharCount = 0;

    // Iterate over each key-value pair in pagesData
    Object.keys(files).forEach((fileKey, index) => {
      const fileData = files[fileKey].textData;

      totalCharCount += fileData.charCountWithoutSpacesAndNumbers;
    });

    const spesifikPrefix = offerData.spesifikOnay ? "-S" : "";

    //To get the birim fiyat
    const birimcode1 = `${originalLang}-${targetLang}${spesifikPrefix}`;

    const birimcode2 = `${targetLang}-${originalLang}${spesifikPrefix}`;

    const birimdocRef = db.collection("fiyatlar").doc("birimfiyatlari");

    const birimdoc = await birimdocRef.get();

    if (!birimdoc.exists) {
      res.status(404).send("Veritabanı hatası. Birim fiyatlara ulaşılamıyor.");
      return;
    }

    const birimdata = birimdoc.data();

    //TODO: spesifik mi değil mi ?
    //spesifik olmayan: tr-en, spesifik: tr-en-S

    let birimfiyat;

    let usedcode;

    if (birimcode1 in birimdata) {
      birimfiyat = birimdata[birimcode1];
      console.log(`Value for ${birimcode1}:`, birimfiyat);
      usedcode = birimcode1;
    } else if (birimcode2 in birimdata) {
      birimfiyat = birimdata[birimcode2];
      console.log(`Value for ${birimcode2}:`, birimfiyat);
      usedcode = birimcode2;
    } else {
      console.log(
        `Neither field ${birimcode1} nor ${birimcode2} exists in the document.`
      );
    }

    if (birimfiyat === undefined) {
      res.status(404).send("From/To language bulunamadı hatası.");
      return; //TODO: not sure
    }

    //CALCULATING THE PRICE

    const realTotalCharCount = totalCharCount; //in case noter does not use the "fixed to 1000" char

    //Fixing it to 1000 if it's less than 1000
    if (totalCharCount < 1000) {
      totalCharCount = 1000;
    }

    //calculating price per character
    const karakterUcreti = totalCharCount * birimfiyat;

    console.log(
      `Karakter Ücreti : (toplam karakter sayısı) ${totalCharCount} x (${usedcode} birim fiyatı) ${birimfiyat} = ${karakterUcreti.toFixed(
        2
      )}`
    );

    //calculating onay prices

    let toplamOnayUcreti = 0;

    let onayUcretleriString = "Onay Ücretleri: ";

    let feeDescriptions = [];

    let onaylar = {};

    let clientOnaylar = {};

    //TODO: calculating noter price (this is a placeholder)

    let noterUcreti = 0;

    if (offerData.noterOnay) {
      noterUcreti = notersabitFiyat + totalCharCount * noterbirimFiyat;

      console.log(
        `Noter Ücreti : (Noter Sabit Fiyat) ${notersabitFiyat} + ((toplam karakter sayısı) ${totalCharCount} x (Noter Birim Fiyat) ${noterbirimFiyat}) = ${noterUcreti.toFixed(
          2
        )}`
      );
      onaylar["noterOnay"] = noterUcreti;
      clientOnaylar["Noter Onayı*: "] = noterUcreti;
    }

    if (offerData.apostilleOnay) {
      toplamOnayUcreti += apostilleOnayFiyat;
      feeDescriptions.push(`(Apostille Onay) ${apostilleOnayFiyat}`);
      onaylar["apostilleOnay"] = apostilleOnayFiyat;
      clientOnaylar["Apostille Onayı: "] = apostilleOnayFiyat;
    }
    if (offerData.kaymakamValilikOnay) {
      toplamOnayUcreti += kaymakamValilikFiyat;
      feeDescriptions.push(`(Kaymakam Valilik Onay) ${kaymakamValilikFiyat}`);
      onaylar["kaymakamValilikOnay"] = kaymakamValilikFiyat;
      clientOnaylar["Kaymakam Valilik Onayı: "] = kaymakamValilikFiyat;
    }
    if (offerData.disisleriOnay) {
      toplamOnayUcreti += disisleriFiyat;
      feeDescriptions.push(`(Dışişleri Onay) ${disisleriFiyat}`);
      onaylar["disisleriOnay"] = disisleriFiyat;
      clientOnaylar["Dışişleri Onayı: "] = disisleriFiyat;
    }
    if (offerData.elcilikKonsoloslukOnay) {
      toplamOnayUcreti += elcilikKonsoloslukFiyat;
      feeDescriptions.push(
        `(Elçilik Konsolosluk Onay) ${elcilikKonsoloslukFiyat}`
      );
      onaylar["elcilikKonsoloslukOnay"] = elcilikKonsoloslukFiyat;
      clientOnaylar["Elçilik Konsolosluk Onayı: "] = elcilikKonsoloslukFiyat;
    }
    if (offerData.almanyaOnay) {
      toplamOnayUcreti += almanyaFiyat;
      feeDescriptions.push(`(Almanya Onay) ${almanyaFiyat}`);
      onaylar["almanyaOnay"] = almanyaFiyat;
      clientOnaylar["Almanya Onayı: "] = almanyaFiyat;
    }
    if (offerData.adliBilirKisiOnay) {
      toplamOnayUcreti += adliBilirKisiFiyat;
      feeDescriptions.push(`(Adli Bilirkişi Onay) ${adliBilirKisiFiyat}`);
      onaylar["adliBilirKisiOnay"] = adliBilirKisiFiyat;
      clientOnaylar["Adli Bilirkişi Onayı: "] = adliBilirKisiFiyat;
    }

    onayUcretleriString +=
      feeDescriptions.join(" + ") + ` = ${toplamOnayUcreti}`;

    console.log(onayUcretleriString);

    //TODO: Calculate Discount according to the user's discount value in his/her profile in firebase.

    //TODO: KDV + Vergi and stuff

    //The Total Sum

    const KDV = 0.2;

    let indirimTutari = 0;

    if (discount > 0) {
      indirimTutari = karakterUcreti * (discount / 100);
    }

    const KDVUcreti = (karakterUcreti - indirimTutari) * KDV;

    finalamount = karakterUcreti + toplamOnayUcreti + KDVUcreti - indirimTutari;

    console.log(
      `(Karakter Ücreti): ${karakterUcreti.toFixed(
        2
      )}, (Noter Ücreti): ${noterUcreti.toFixed(
        2
      )}, (Onay Ücretleri): ${toplamOnayUcreti.toFixed(2)}`
    );

    //html content for the teklif hazır mail

    //html content for the teklif hazır mail

    let newHistoryEntry = {};

    //let newStatus = "";

    if (offerData.isReOffer) {
      //Yani: Tercüman tercümede bir değişiklik yaptı ise
      finalamount = offerData.reOfferPrice;

      console.log(
        `${offerData.reOfferTranslatorName} teklifi ${finalamount} olarak revize etti.`
      );
      newHistoryEntry = {
        timestamp: admin.firestore.Timestamp.now(),
        description: `${offerData.reOfferTranslatorName} teklifi ${finalamount} olarak revize etti.`,
        hidden: false,
      };

      newStatus = "waitinguserfirstpayment";

      try {
        await sendTeklifOnayMail(
          offerData.translationID,
          finalamount,
          userEmail
        );
        console.log("Email notification sent successfully from getOffer.");
      } catch (error) {
        console.error(
          "Failed to send email notification from getOffer:",
          error
        );
        // Additional error handling, like retrying or logging to an external service
      }

      //sendTeklifOnayMail(offerData.translationID, true, finalamount);
    } else {
      let historyString = `Karakter Ücreti: ${karakterUcreti} TL`;

      if (toplamOnayUcreti > 0) {
        historyString += `, Onay Ücretleri (Noter harici): ${toplamOnayUcreti} TL`;
      }

      if (noterUcreti > 0) {
        historyString += `, Tahmini Noter Ücreti: ${noterUcreti} TL`;
      }

      if (indirimTutari > 0) {
        historyString += `, İndirim Tutarı(${discount}%): ${indirimTutari} TL`;
      }

      historyString += `, KDV(20%): ${KDVUcreti} TL teklif alındı.`;

      console.log(historyString);
      newHistoryEntry = {
        timestamp: admin.firestore.Timestamp.now(),
        description: historyString,
        hidden: false,
      };
      newStatus = "waitinguserconfirmation";
    }

    //update the translation document with the calculated prices
    await translationdocRef.update({
      //onayUcretleriString: onayUcretleriString,
      translationName: offerData.translationName,
      discount: discount,
      onaylar: onaylar,
      finalamount: parseFloat(finalamount.toFixed(2)),
      karakterUcreti: parseFloat(karakterUcreti.toFixed(2)),
      noterUcreti: parseFloat(noterUcreti.toFixed(2)),
      toplamOnayUcreti: parseFloat(toplamOnayUcreti.toFixed(2)),
      KDVUcreti: parseFloat(KDVUcreti.toFixed(2)),
      indirimTutari: parseFloat(indirimTutari.toFixed(2)),
      clientOnaylar: clientOnaylar,
      targetLanguage: targetLang,
      status: newStatus,
      [offerData.isReOffer
        ? "waitingUserFirstPaymentStartedAt"
        : "waitingUserConfirmationStartedAt"]: admin.firestore.Timestamp.now(),
      userEmail: userEmail,
      userName: userName,
      userSurname: userSurname,
      userPhone: userPhone,
      history: admin.firestore.FieldValue.arrayUnion(newHistoryEntry),
      approved: offerData.isReOffer,
    });

    // Send the data as response
    res.status(200).json({
      discount: discount,
      finalamount: parseFloat(finalamount.toFixed(2)),
      karakterUcreti: parseFloat(karakterUcreti.toFixed(2)),
      noterUcreti: parseFloat(noterUcreti.toFixed(2)),
      toplamOnayUcreti: parseFloat(toplamOnayUcreti.toFixed(2)),
      KDVUcreti: parseFloat(KDVUcreti.toFixed(2)),
      indirimTutari: parseFloat(indirimTutari.toFixed(2)),
      clientOnaylar: clientOnaylar,
      translationID: offerData.translationID,
    });

    //return;
  } catch (error) {
    console.error("Error fetching document:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/updateNoterPrice", async (req, res) => {
  try {
    // HTTP method check
    if (req.method !== "POST") {
      console.error("Geçersiz istek yöntemi kullanıldı.");
      return res.status(405).send("Sadece POST istekleri kabul edilir.");
    }

    // Extracting variables from request body
    const { translationID, noterPrice } = req.body;

    // Input validation
    if (!translationID || noterPrice === undefined) {
      console.error("Eksik parametreler: translationID veya noterPrice eksik.");
      return res.status(400).send("translationID ve noterPrice gereklidir.");
    }

    // Accessing the translation document
    const translationRef = db.collection("translations").doc(translationID);
    const doc = await translationRef.get();

    if (!doc.exists) {
      console.error(`Belge bulunamadı: translationID ${translationID}`);
      return res.status(404).send("Belge bulunamadı.");
    }

    const data = doc.data();

    // Status check
    if (data.status !== "waitingtranslatorapproval") {
      console.error(
        `Belge güncellenemedi: Mevcut durum '${data.status}' uygun değil.`
      );
      return res
        .status(400)
        .send(
          `Belge şu anda '${data.status}' durumunda. Bu işlem sadece 'waitingtranslatorapproval' durumunda yapılabilir.`
        );
    }

    // Updating noterUcreti with incoming noterPrice
    const noterUcreti = parseFloat(noterPrice);

    // Updating the 'onaylar' map with the new noterPrice
    const onaylar = data.onaylar || {};
    onaylar["noterOnay"] = noterUcreti;

    const noterBilgileriRef = db.collection("misc").doc("noterBilgileri");
    const noterBilgileriDoc = await noterBilgileriRef.get();

    if (!noterBilgileriDoc.exists) {
      console.error("Noter bilgileri bulunamadı.");
      return res.status(500).send("Noter bilgileri bulunamadı.");
    }

    const noterBilgileri = noterBilgileriDoc.data();
    const iban = noterBilgileri.iban;
    const hesapno = noterBilgileri.hesapno;
    const sube = noterBilgileri.sube;
    const banka = noterBilgileri.banka;

    // Invoke sendNoterMail function
    const userEmail = data.userEmail;

    if (!userEmail) {
      console.error("Kullanıcı e-posta adresi bulunamadı.");
      return res
        .status(400)
        .send(
          "Kullanıcı e-posta adresi bulunamadı. Noter maili gönderilemedi."
        );
    }

    await sendNoterMail(
      iban,
      hesapno,
      sube,
      banka,
      userEmail,
      noterUcreti,
      translationID
    );
    console.log(
      `Noter maili gönderildi: IBAN ${iban}, alıcı ${userEmail}, tutar ${noterUcreti} TL`
    );

    // Creating history entry
    let historyString = `Noter Ücreti ${noterUcreti.toFixed(
      2
    )} TL olarak güncellendi ve kullanıcıya e-posta gönderildi.`;

    console.log(historyString);

    const newHistoryEntry = {
      timestamp: admin.firestore.Timestamp.now(),
      description: historyString,
      hidden: false,
    };

    // Updating the document in Firestore
    await translationRef.update({
      noterUcreti,
      onaylar,
      noterStatus: "Ücret müşteriye bildirildi",
      history: admin.firestore.FieldValue.arrayUnion(newHistoryEntry),
    });

    console.log(`Belge başarıyla güncellendi: translationID ${translationID}`);
    return res.status(200).send("Belge başarıyla güncellendi.");
  } catch (error) {
    console.error("Bilinmeyen bir hata oluştu:", error);
    return res
      .status(500)
      .send("Sunucu hatası. Lütfen daha sonra tekrar deneyiniz.");
  }
});

app.post("/setNoterAsPaid", async (req, res) => {
  try {
    // HTTP method check
    if (req.method !== "POST") {
      console.error("Geçersiz istek yöntemi kullanıldı.");
      return res.status(405).send("Sadece POST istekleri kabul edilir.");
    }

    // Extracting translationID from request body
    const { translationID } = req.body;

    // Input validation
    if (!translationID) {
      console.error("Eksik parametre: translationID gerekli.");
      return res.status(400).send("translationID gereklidir.");
    }

    // Accessing the translation document
    const translationRef = db.collection("translations").doc(translationID);
    const doc = await translationRef.get();

    if (!doc.exists) {
      console.error(`Belge bulunamadı: translationID ${translationID}`);
      return res.status(404).send("Belge bulunamadı.");
    }

    // Updating noterStatus to "Ödendi"
    await translationRef.update({
      noterStatus: "Ödendi",
    });

    // Creating history entry
    const historyString = `Noter ücreti ödendi olarak işaretlendi.`;

    console.log(historyString);

    const newHistoryEntry = {
      timestamp: admin.firestore.Timestamp.now(),
      description: historyString,
      hidden: false,
    };

    // Adding the history entry
    await translationRef.update({
      history: admin.firestore.FieldValue.arrayUnion(newHistoryEntry),
    });

    console.log(`Belge başarıyla güncellendi: translationID ${translationID}`);
    return res.status(200).send("Noter durumu başarıyla güncellendi.");
  } catch (error) {
    console.error("Bilinmeyen bir hata oluştu:", error);
    return res
      .status(500)
      .send("Sunucu hatası. Lütfen daha sonra tekrar deneyiniz.");
  }
});

app.post("/updateCharPrice", async (req, res) => {
  try {
    // Request method check
    if (req.method !== "POST") {
      console.error("Geçersiz istek yöntemi kullanıldı.");
      return res.status(405).send("Sadece POST istekleri kabul edilir.");
    }

    // Extracting variables from request body
    const { translationID, charPrice } = req.body;

    // Input validation
    if (!translationID || !charPrice) {
      console.error("Eksik parametreler: translationID veya charPrice eksik.");
      return res.status(400).send("translationID ve charPrice gereklidir.");
    }

    // Accessing the translation document
    const translationRef = db.collection("translations").doc(translationID);
    const doc = await translationRef.get();

    if (!doc.exists) {
      console.error(`Belge bulunamadı: translationID ${translationID}`);
      return res.status(404).send("Belge bulunamadı.");
    }

    const data = doc.data();

    // Status check
    if (data.status !== "waitingtranslatorapproval") {
      console.error(
        `Belge güncellenemedi: Mevcut durum '${data.status}' uygun değil.`
      );
      return res
        .status(400)
        .send(
          `Belge şu anda '${data.status}' durumunda. Bu işlem sadece 'waitingtranslatorapproval' durumunda yapılabilir.`
        );
    }

    // Fetching existing values from the document
    const discount = data.discount || 0;
    const toplamOnayUcreti = data.toplamOnayUcreti || 0;
    const noterUcreti = data.noterUcreti || 0;

    // Updating karakterUcreti with incoming charPrice
    const karakterUcreti = parseFloat(charPrice);

    // Calculating indirimTutari and KDVUcreti
    const KDV = 0.2;
    let indirimTutari = 0;

    if (discount > 0) {
      indirimTutari = karakterUcreti * (discount / 100);
    }

    const KDVUcreti = (karakterUcreti - indirimTutari) * KDV;

    // Calculating finalamount
    const finalamount =
      karakterUcreti + toplamOnayUcreti + KDVUcreti - indirimTutari;

    // Creating history entry
    let historyString = `Teklif, Karakter Ücreti: ${karakterUcreti.toFixed(
      2
    )} TL`;

    if (toplamOnayUcreti > 0) {
      historyString += `, Onay Ücretleri (Noter harici): ${toplamOnayUcreti.toFixed(
        2
      )} TL`;
    }

    if (noterUcreti > 0) {
      historyString += `, Tahmini Noter Ücreti: ${noterUcreti.toFixed(2)} TL`;
    }

    if (indirimTutari > 0) {
      historyString += `, İndirim Tutarı(${discount}%): ${indirimTutari.toFixed(
        2
      )} TL`;
    }

    historyString += `, KDV(20%): ${KDVUcreti.toFixed(
      2
    )} TL olarak güncellendi.`;

    console.log(historyString);

    const newHistoryEntry = {
      timestamp: admin.firestore.Timestamp.now(),
      description: historyString,
      hidden: false,
    };

    // Updating the document in Firestore
    await translationRef.update({
      karakterUcreti,
      indirimTutari,
      KDVUcreti,
      finalamount,
      history: admin.firestore.FieldValue.arrayUnion(newHistoryEntry),
    });

    console.log(`Belge başarıyla güncellendi: translationID ${translationID}`);
    return res.status(200).send("Belge başarıyla güncellendi.");
  } catch (error) {
    console.error("Bilinmeyen bir hata oluştu:", error);
    return res
      .status(500)
      .send("Sunucu hatası. Lütfen daha sonra tekrar deneyiniz.");
  }
});

app.post("/testextract", upload.array("files"), (req, res) => {
  //const userUID = req.body.UID;

  console.log("Text extract execution finished.");

  res.status(200).json({
    language: "de",
    message: "Operation finished",
    translationID: "RuRG5eegQlMSwZmOEElb",
  });
});

async function checkDuplicatePhoneNumber(userUID, fullPhoneNumber) {
  try {
    const listUsersResult = await admin.auth().listUsers();
    for (const userRecord of listUsersResult.users) {
      if (
        userRecord.phoneNumber === fullPhoneNumber &&
        userRecord.uid !== userUID
      ) {
        return true; // Duplicate found
      }
    }
    return false; // No duplicate
  } catch (error) {
    console.error("Telefon numarası kontrol edilirken hata oluştu:", error);
    throw error;
  }
}

app.post("/updateProfile", async (req, res) => {
  const { userUID, key, countryCode, phoneNumber } = req.body;

  let value = req.body.value;

  console.log("Received data:", req.body);

  // Validate request payload
  if (!userUID || !key || (key === "phone" && (!countryCode || !phoneNumber))) {
    return res.status(400).send({ message: "Geçersiz istek verisi." });
  }

  if (key === "languages") {
    if (value === "gb") {
      value = "en";
    } else if (value === "ir") {
      value = "fa";
    } else if (value === "be") {
      value = "fl";
    } else if (value === "dk") {
      value = "da";
    } else if (value === "se") {
      value = "sv";
    } else if (value === "rs") {
      value = "sr";
    } else if (value === "tm") {
      value = "tk";
    } else if (value === "si") {
      value = "sl";
    } else if (value === "il") {
      value = "he";
    }
  }

  try {
    const userDocRef = db.collection("users").doc(userUID);

    // Handle phone-specific logic
    if (key === "phone") {
      const fullPhoneNumber = `+${countryCode}${phoneNumber}`;

      // Check for duplicates
      const phoneExists = await checkDuplicatePhoneNumber(
        userUID,
        fullPhoneNumber
      );
      if (phoneExists) {
        return res.status(400).send({
          message:
            "Bu telefon numarası zaten başka bir kullanıcı tarafından kullanılıyor.",
        });
      }

      // Update country code and phone number separately in Firestore
      await userDocRef.update({
        countryCode: countryCode,
        phone: phoneNumber,
      });

      return res
        .status(200)
        .send({ message: "Telefon bilgileri başarıyla güncellendi." });
    }

    // Generic updates for other fields
    await userDocRef.update({
      [key]: value,
    });

    return res
      .status(200)
      .send({ message: "Kullanıcı bilgileri başarıyla güncellendi." });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res
      .status(500)
      .send({ message: "Kullanıcı bilgileri güncellenemedi." });
  }
});

// Function to check for duplicate phone numbers

app.post("/uploadExtractPDF", upload.single("file"), async (req, res) => {
  // Check if file was uploaded
  if (!req.file) {
    console.log("No file uploaded");
    return res.status(400).send("No file uploaded");
  }

  const userUID = req.file.originalname.split("_")[0];

  // Ensure userUID is provided
  if (!userUID || userUID.length === 0) {
    console.log("Invalid or missing User UID");
    return res.status(400).send("Invalid or missing User UID");
  }

  const filePath = req.file.path;

  try {
    // Initial setup, create credentials instance
    const credentials = new ServicePrincipalCredentials({
      clientId: process.env.PDF_SERVICES_CLIENT_ID,
      clientSecret: process.env.PDF_SERVICES_CLIENT_SECRET,
    });

    // Creates a PDF Services instance
    const pdfServices = new PDFServices({ credentials });

    // Creates an asset(s) from source file(s) and upload
    const readStream = fs.createReadStream(filePath);
    const inputAsset = await pdfServices.upload({
      readStream,
      mimeType: MimeType.PDF,
    });

    // Create parameters for the job
    const params = new ExtractPDFParams({
      elementsToExtract: [ExtractElementType.TEXT],
    });

    // Creates a new job instance
    const job = new ExtractPDFJob({ inputAsset, params });

    // Submit the job and get the job result
    const pollingURL = await pdfServices.submit({ job });
    const pdfServicesResponse = await pdfServices.getJobResult({
      pollingURL,
      resultType: ExtractPDFResult,
    });

    // Get content from the resulting asset(s)
    const resultAsset = pdfServicesResponse.result.resource;
    const streamAsset = await pdfServices.getContent({ asset: resultAsset });

    // Create the output directory if it doesn't exist
    const outputDir = path.join(__dirname, "uploads", userUID, "translations");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Creates a write stream and copy stream asset's content to it
    const outputFilePath = path.join(
      outputDir,
      `ExtractedText_${req.file.filename}.zip`
    );
    console.log(`Saving asset at ${outputFilePath}`);

    const writeStream = fs.createWriteStream(outputFilePath);
    streamAsset.readStream.pipe(writeStream);

    // Handle finish and error events
    writeStream.on("finish", async () => {
      console.log("File saved successfully.");

      // Extract text from structuredData.json
      const zip = new AdmZip(outputFilePath);
      const jsonFile = zip.readAsText("structuredData.json");
      const jsonData = JSON.parse(jsonFile);

      const detectedLanguage = jsonData.extended_metadata.language;
      const pagecount = jsonData.extended_metadata.page_count;

      let fullText = "";
      if (jsonData.elements) {
        jsonData.elements.forEach((element) => {
          if (element.Text) {
            fullText += " " + element.Text;
          }
        });
      }

      // Calculate word count
      //const wordCount = fullText.trim().split(/\s+/).length;
      //console.log(`Word count: ${wordCount}`);
      //
      //// Calculate character count
      //const characterCount = fullText.replace(/\s+/g, "").length;
      //console.log(`Character count (excluding spaces): ${characterCount}`);
      //
      //// Calculate character count (excluding numbers)
      //const characterCountWithoutNumbers = fullText
      //  .replace(/\d+/g, "")
      //  .replace(/\s+/g, "").length;
      //console.log(
      //  `Character count (excluding numbers): ${characterCountWithoutNumbers}`
      //);

      const pagesData = analyzePages(jsonData);

      // Save full text to a .txt file
      const textFilePath = path.join(
        outputDir,
        `ExtractedText_${req.file.filename}.txt`
      );
      fs.writeFileSync(textFilePath, fullText.trim());

      //TODO: REMOVE ANY TRANSLATIONS WITH THE STATUS "waitingoffer" FROM THE DATABASE!!
      //TODO: IF THE STATUS IS "waitinguserconfirmation" DELETE THE FILE, THE PDF, THE TXT AND THE ZIP FROM THE STORAGE

      const translationData = {
        userUID: db.doc(`users/${userUID}`),
        filename: req.file.originalname,
        rawFileName: req.file.originalname.split("_").slice(1).join("_"),
        outputFilePath,
        textFilePath,
        language: jsonData.extended_metadata.language,
        pageCount: jsonData.extended_metadata.page_count,
        pagesData: pagesData,
        status: "waitingoffer",
        createdAt: admin.firestore.Timestamp.now(), // Timestamp from Firebase
      };

      try {
        // Add new document to translations collection
        const translationRef = await db
          .collection("translations")
          .add(translationData);

        // Update user's translations array in users collection

        res.status(200).json({
          message: "File uploaded and processed successfully",
          translationID: translationRef.id,
        });
      } catch (error) {
        console.error("Error during file upload or processing:", error);
        res.status(500).json({ error: "An error occurred during the process" });
      }

      // Respond with word count and file paths
      //  res.status(200).json({
      //    message: "Extracted text file saved successfully",
      //    //wordCount: wordCount,
      //    //outputFilePath: outputFilePath,
      //    //textFilePath: textFilePath,
      //    //language: detectedLanguage,
      //    //pagecount: pagecount,
      //    //characterCount: characterCount,
      //    //characterCountWithoutNumbers: characterCountWithoutNumbers,
      //    //...pagesData,
      //  });
    });

    writeStream.on("error", (err) => {
      console.error("Error writing the file", err);
      res.status(500).send("Error writing the file");
    });
  } catch (err) {
    if (
      err instanceof SDKError ||
      err instanceof ServiceUsageError ||
      err instanceof ServiceApiError
    ) {
      console.log("Exception encountered while executing operation", err);
      res.status(500).send("Error processing PDF extraction");
    } else {
      console.log("Exception encountered while executing operation", err);
      res.status(500).send("Error processing PDF extraction");
    }
  }
});

// OCR endpoint to upload a PDF and perform OCR using Adobe API
app.post("/uploadOCR", upload.single("file"), async (req, res) => {
  const userUID = req.file.originalname.split("_")[0];

  console.log("UserUID: ", userUID);

  // Check if file was uploaded
  if (!req.file) {
    console.log("No file uploaded");
    return res.status(400).send("No file uploaded");
  }

  // Ensure userUID is provided
  if (!userUID) {
    console.log("User UID is missing");
    return res.status(400).send("User UID is missing");
  }

  const filePath = req.file.path;

  try {
    // Initial setup, create credentials instance
    const credentials = new ServicePrincipalCredentials({
      clientId: process.env.PDF_SERVICES_CLIENT_ID,
      clientSecret: process.env.PDF_SERVICES_CLIENT_SECRET,
    });

    // Creates a PDF Services instance
    const pdfServices = new PDFServices({ credentials });

    // Creates an asset(s) from source file(s) and upload
    const readStream = fs.createReadStream(filePath);
    const inputAsset = await pdfServices.upload({
      readStream,
      mimeType: MimeType.PDF,
    });

    const params = new OCRParams({
      ocrLocale: OCRSupportedLocale.TR_TR,
      ocrType: OCRSupportedType.SEARCHABLE_IMAGE_EXACT,
    });

    // Creates a new job instance
    const job = new OCRJob({ inputAsset, params });

    // Submit the job and get the job result
    const pollingURL = await pdfServices.submit({ job });
    const pdfServicesResponse = await pdfServices.getJobResult({
      pollingURL,
      resultType: OCRResult,
    });

    // Get content from the resulting asset(s)
    const resultAsset = pdfServicesResponse.result.asset;
    const streamAsset = await pdfServices.getContent({ asset: resultAsset });

    // Create the output directory if it doesn't exist
    const outputDir = path.join(__dirname, "uploads", userUID, "translations");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Creates a write stream and copy stream asset's content to it
    const outputFilePath = path.join(outputDir, `OCR_${req.file.filename}`);
    console.log(`Saving asset at ${outputFilePath}`);

    const writeStream = fs.createWriteStream(outputFilePath);
    streamAsset.readStream.pipe(writeStream);

    writeStream.on("finish", () => {
      console.log("File saved successfully.");
      res.status(200).send(`OCR file saved successfully: ${outputFilePath}`);
    });

    writeStream.on("error", (err) => {
      console.error("Error writing the file", err);
      res.status(500).send("Error writing the file");
    });
  } catch (err) {
    if (
      err instanceof SDKError ||
      err instanceof ServiceUsageError ||
      err instanceof ServiceApiError
    ) {
      console.log("Exception encountered while executing operation", err);
      res.status(500).send("Error processing OCR");
    } else {
      console.log("Exception encountered while executing operation", err);
      res.status(500).send("Error processing OCR");
    }
  }
});

// Test endpoint to check Firestore connection
app.get("/firestoreTest", async (req, res) => {
  const testDocRef = db.collection("testCollection").doc("testDoc");

  //console.log(db);

  try {
    // Write a test document
    await testDocRef.set({
      testField: "testValue",
    });

    // Read the test document
    const doc = await testDocRef.get();
    if (doc.exists) {
      res.status(200).json({
        message: "Firestore connection successful",
        data: doc.data(),
      });
    } else {
      res.status(404).json({ message: "Document not found" });
    }
  } catch (error) {
    logger.error("Error in Firestore test endpoint", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

// Example registration endpoint
app.post("/register", async (req, res) => {
  const { name, surname, email, phone, password, userType, code, countryCode } =
    req.body;

  if (!name || !surname || !email || !phone || !password) {
    res.status(400).send("All fields are required");
    return;
  }

  try {
    // Check if an invitation code is provided
    let finalUserType = "customer";
    let discount = 0;
    let corp = false;
    let codeKey; // Store codeKey for later expiration

    if (code) {
      const invitationDoc = await db
        .collection("kodlar")
        .doc("invitation")
        .get();

      if (invitationDoc.exists) {
        const invitationData = invitationDoc.data();

        // Find a code with matching value and not expired
        const matchingCodeEntry = Object.entries(invitationData).find(
          ([, details]) => details.value === code && !details.expired
        );

        if (matchingCodeEntry) {
          [codeKey, codeDetails] = matchingCodeEntry;

          // Apply code attributes to user
          if (codeDetails.translator) finalUserType = "translator2";
          if (codeDetails.discount > 0) discount = codeDetails.discount;
          if (codeDetails.corp) corp = true;
        } else {
          return res.status(400).send("Invalid or expired code.");
        }
      } else {
        return res.status(400).send("Invitation document not found.");
      }
    }

    // Create user in Firebase Auth
    let userRecord;
    try {
      // Create user in Firebase Auth
      userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: `${name} ${surname}`,
        phoneNumber: phone,
      });
    } catch (authError) {
      if (
        authError.code === "auth/email-already-exists" ||
        authError.code === "auth/phone-number-already-exists"
      ) {
        return res.status(400).send(authError.message);
      } else {
        throw authError;
      }
    }

    // Prepare user data for Firestore
    const userData = {
      name,
      surname,
      email,
      phone,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      userType: finalUserType,
      profilePicUrl: defaultProfilePicUrl,
      countryCode: countryCode,
    };

    if (discount > 0) {
      userData.discount = discount;
    }
    if (corp) {
      userData.corp = corp;
    }

    if (finalUserType === "translator2") {
      userData.languages = "tr";
      userData.rating = 0;
    }

    // Add user data to Firestore
    await db.collection("users").doc(userRecord.uid).set(userData);

    // Set custom claims for 'translator2' userType
    if (finalUserType === "translator2") {
      await admin
        .auth()
        .setCustomUserClaims(userRecord.uid, { translator2: true });
    }

    // Expire the invitation code only after successful registration
    if (codeKey) {
      await db
        .collection("kodlar")
        .doc("invitation")
        .update({
          [`${codeKey}.expired`]: true,
          [`${codeKey}.usedBy`]: email,
          [`${codeKey}.usedAt`]: admin.firestore.FieldValue.serverTimestamp(),
        });
    }

    // Generate a custom token for immediate login
    const customToken = await admin.auth().createCustomToken(userRecord.uid);

    // Log success and return the custom token
    logger.info("User registered successfully", {
      docId: userRecord.uid,
      email,
      time: new Date().toISOString(),
    });
    res
      .status(201)
      .json({ message: "User registered successfully", token: customToken });
  } catch (error) {
    logger.error("Error registering user", {
      error: error.message,
      stack: error.stack,
    });

    // If user creation partially succeeded, delete the user to avoid residual data
    if (userRecord && userRecord.uid) {
      await admin.auth().deleteUser(userRecord.uid);
      logger.info(`Partially created user deleted: ${userRecord.uid}`);
    }

    res.status(400).send(error.message || "Internal Server Error");
  }
});

app.post("/generate-invitation-code", async (req, res) => {
  const { discount, translator, corp } = req.body;

  // Function to generate a code with 3 uppercase letters and 3 numbers
  const generateCode = () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "123456789";

    // Generate 3 random uppercase letters
    let codeParts = [];
    for (let i = 0; i < 3; i++) {
      codeParts.push(
        letters.charAt(Math.floor(Math.random() * letters.length))
      );
    }

    // Generate 3 random numbers
    for (let i = 0; i < 3; i++) {
      codeParts.push(
        numbers.charAt(Math.floor(Math.random() * numbers.length))
      );
    }

    // Shuffle the array to mix letters and numbers
    for (let i = codeParts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [codeParts[i], codeParts[j]] = [codeParts[j], codeParts[i]];
    }

    // Join the array into a string
    return codeParts.join("");
  };

  try {
    // Generate a unique invitation code
    const code = generateCode();

    // Structure the document with the required fields
    const invitationData = {
      translator,
      corp,
      discount,
      expired: false,
      value: code,
    };

    // Store in Firestore under "kodlar" collection in "invitation" document
    await db
      .collection("kodlar")
      .doc("invitation")
      .set(
        { [code]: invitationData },
        { merge: true } // Merge to avoid overwriting existing codes
      );

    // Send back the generated code
    res.status(201).json({ code });
  } catch (error) {
    console.error("Error generating invitation code:", error);
    res.status(500).send("Error generating invitation code");
  }
});

app.post("/setTranslator2Role", async (req, res) => {
  const { uid } = req.body;

  // Authenticate the admin user making the request
  // You need to implement authentication and check if the requester is an admin

  console.log("Incoming uid: ", uid);

  try {
    // Set custom claims
    await admin.auth().setCustomUserClaims(uid, { translator2: true });

    // Update userType in Firestore
    await db.collection("users").doc(uid).update({ userType: "translator2" });

    res.status(200).send(`Translator role assigned to user ${uid}`);
  } catch (error) {
    console.error("Error setting translator2 role:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Export the Express app as an HTTP function
//exports.api = functions.https.onRequest(app);

// to upload conversion rates (for later use)

/*
const ratesTable = {
  en: { tr: [0.2, 0.3], de: [0.3, 0.5], en: [0.3, 0.5] },
  de: { tr: [0.2, 0.3], de: [0.3, 0.5], en: [0.3, 0.5] },
  fr: { tr: [0.2, 0.3], de: [0.3, 0.5], en: [0.3, 0.5] },
  az: { tr: [0.5, 0.7], de: [0.7, 1.0], en: [0.7, 1.0] },
  ru: { tr: [0.5, 0.7], de: [0.7, 1.0], en: [0.7, 1.0] },
  uk: { tr: [0.5, 0.7], de: [0.7, 1.0], en: [0.7, 1.0] },
  bg: { tr: [0.5, 0.7], de: [0.7, 1.0], en: [0.7, 1.0] },
  ar: { tr: [0.5, 0.7], de: [0.7, 1.0], en: [0.7, 1.0] },
  fa: { tr: [0.5, 0.7], de: [0.7, 1.0], en: [0.7, 1.0] },
  it: { tr: [0.5, 0.7], de: [0.7, 1.0], en: [0.7, 1.0] },
  es: { tr: [0.5, 0.7], de: [0.7, 1.0], en: [0.7, 1.0] },
  pt: { tr: [0.5, 0.7], de: [0.7, 1.0], en: [0.7, 1.0] },
  nl: { tr: [0.6, 0.7], de: [0.8, 1.0], en: [0.8, 1.0] },
  fl: { tr: [0.6, 0.7], de: [0.8, 1.0], en: [0.8, 1.0] },
  no: { tr: [0.85, 1.0], de: [1.0, 1.2], en: [1.0, 1.2] },
  da: { tr: [0.85, 1.0], de: [1.0, 1.2], en: [1.0, 1.2] },
  sv: { tr: [0.85, 1.0], de: [1.0, 1.2], en: [1.0, 1.2] },
  ge: { tr: [1.0, 1.25], de: [1.25, 1.5], en: [1.25, 1.5] },
  fi: { tr: [1.0, 1.25], de: [1.25, 1.5], en: [1.25, 1.5] },
  al: { tr: [0.75, 1.0], de: [1.0, 1.25], en: [1.0, 1.25] },
  sr: { tr: [0.75, 1.0], de: [1.0, 1.25], en: [1.0, 1.25] },
  hr: { tr: [0.75, 1.0], de: [1.0, 1.25], en: [1.0, 1.25] },
  mk: { tr: [0.75, 1.0], de: [1.0, 1.25], en: [1.0, 1.25] },
  tk: { tr: [0.75, 1.0], de: [1.0, 1.25], en: [1.0, 1.25] },
  kz: { tr: [1.0, 1.25], de: [1.25, 1.5], en: [1.25, 1.5] },
  kg: { tr: [1.0, 1.25], de: [1.25, 1.5], en: [1.25, 1.5] },
  uz: { tr: [1.0, 1.25], de: [1.25, 1.5], en: [1.25, 1.5] },
  pl: { tr: [1.0, 1.25], de: [1.25, 1.5], en: [1.25, 1.5] },
  hu: { tr: [0.75, 1.0], de: [1.0, 1.25], en: [1.0, 1.25] },
  mo: { tr: [0.75, 1.0], de: [1.0, 1.25], en: [1.0, 1.25] },
  ro: { tr: [0.75, 1.0], de: [1.0, 1.25], en: [1.0, 1.25] },
  cz: { tr: [1.0, 1.25], de: [1.25, 1.5], en: [1.25, 1.5] },
  sk: { tr: [1.0, 1.25], de: [1.25, 1.5], en: [1.25, 1.5] },
  sl: { tr: [1.0, 1.25], de: [1.25, 1.5], en: [1.25, 1.5] },
  cn: { tr: [1.0, 1.25], de: [1.25, 1.5], en: [1.25, 1.5] },
  jp: { tr: [1.0, 1.25], de: [1.25, 1.5], en: [1.25, 1.5] },
  kr: { tr: [1.0, 1.25], de: [1.25, 1.5], en: [1.25, 1.5] },
  gr: { tr: [1.0, 1.25], de: [1.25, 1.5], en: [1.25, 1.5] },
  he: { tr: [1.0, 1.25], de: [1.25, 1.5], en: [1.25, 1.5] },
  hy: { tr: [1.0, 1.25], de: [1.25, 1.5], en: [1.25, 1.5] },
};

// Function to generate and set conversion rates in Firestore
const setConversionRates = async () => {
  const conversionRates = {};

  for (const [sourceCode, rates] of Object.entries(ratesTable)) {
    for (const [targetCode, rate] of Object.entries(rates)) {
      if (sourceCode !== targetCode) {
        // Non-specific rate
        conversionRates[`${sourceCode}-${targetCode}`] = rate[0];
        // Specific rate
        conversionRates[`${sourceCode}-${targetCode}-S`] = rate[1];
      }
    }
  }

  await db.collection("fiyatlar").doc("birimfiyatlari").set(conversionRates);
  console.log("Added conversion rates to birimfiyatlari document");
};

*/

// to upload conversion rates (for later use)

//FOR LOCAL DEVELOPMENT
//const port = 5001; // You can choose any available port
//app.listen(port, () => {
//  console.log(`Server is running on http://localhost:${port}`);
//});

//FOR FIREBASE FUNCTIONS

//exports.app = functions.https.onRequest(app);

//FOR AWS LAMBDA
//module.exports.handler = serverless(app);

//FOR DOCKER
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
