const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const { Observable, zip } = require('rxjs');
const { switchMap } = require('rxjs/operators');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = 'google_token/token.json';
const CREDENTIALS_JSON =
  'credential/client_secret_581930412554-khdp5ovhbcpahm9fm9552mud69q9jb0l.apps.googleusercontent.com.json';

function getAuth() {
  return getCredentials().pipe(switchMap((rs) => authorize(rs)));
}

function getAuthOperator() {
  return (prev) => {
    return new Observable((observ) => {
      zip(prev, getAuth()).subscribe({
        next: (rs) => observ.next(rs),
      });
    });
  };
}

function getCredentials() {
  return new Observable((observ) => {
    return fs.readFile(CREDENTIALS_JSON, (err, content) => {
      observ.next(content);
    });
  });
}

function authorize(credentials) {
  const used = JSON.parse(credentials);
  const { client_secret, client_id, redirect_uris } = used.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[1]
  );

  return new Observable((observ) => {
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) return getNewToken(oAuth2Client);
      oAuth2Client.setCredentials(JSON.parse(token));
      observ.next(oAuth2Client);
    });
  });
}

function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('plz auth', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err)
        return console.error(
          'Error while trying to retrieve access token',
          err
        );
      oAuth2Client.setCredentials(token);
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
      });
    });
  });
}

// function listMajors(auth) {
//   const sheets = google.sheets({ version: 'v4', auth });
//   return new Observable((observ) => {
//     sheets.spreadsheets.values.get(
//       {
//         spreadsheetId: sheetId,
//         range: 'A2:D1000',
//       },
//       (err, res) => {
//         const rows = res.data.values;
//         data.next(rows);
//         observ.next(rows);
//         observ.complete();
//       }
//     );
//   });
// }

// function writeValuesOperator() {
//   return (prev) =>
//     new Observable((observ) => {
//       prev.subscribe((paramList) => {
//         const val = paramList[0];
//         const auth = paramList[1];
//         const sheets = google.sheets({ version: 'v4', auth });
//         sheets.spreadsheets.values.append(
//           {
//             spreadsheetId: sheetId,
//             range: 'A1',
//             valueInputOption: 'RAW',
//             requestBody: {
//               majorDimension: 'COLUMNS',
//               range: 'A1',
//               values: [
//                 [val.storeName],
//                 [val.suggestMenu],
//                 [val.worstMenu],
//                 [val.score],
//               ],
//             },
//           },
//           () => {
//             observ.next(true);
//             observ.complete(true);
//           }
//         );
//       });
//     });
// }

module.exports.getAuth = getAuth;
module.exports.getAuthOperator = getAuthOperator;

