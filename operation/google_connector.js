const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const { Observable, Subject } = require('rxjs');
const { switchMap } = require('rxjs/operators');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = 'google_token/token.json';
const CREDENTIALS_JSON =
  'credential/client_secret_581930412554-khdp5ovhbcpahm9fm9552mud69q9jb0l.apps.googleusercontent.com.json';

const data = new Subject();
const data$ = getAuth().pipe(switchMap(listMajors));
const sheetId = '1o8G4tBCicfVgqMp2Y6tWV5j8GOXfsgOk4pzg4Eo_VLQ';

const valueWrite = new Subject();
// const valueWrite$ = getAuth().pipe(switchMap(writeValues));
const valueWrite$ = valueWrite.pipe(switchMap(getAuth()));
valueWrite$.subscribe(console.log);

function getAuth() {
  return getCredentials().pipe(switchMap((rs) => authorize(rs)));
}

function getAuthOperator() {
  return (prev) => {
    new Observable((observ) => {
      const sub = prev.subscribe({
        next: observ.next()
      })
    });
  };
}

function getCredentials() {
  return new Observable((observ) => {
    return fs.readFile(CREDENTIALS_JSON, (err, content) => {
      observ.next(content);
      observ.complete();
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
      observ.complete();
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

function listMajors(auth) {
  const sheets = google.sheets({ version: 'v4', auth });
  return new Observable((observ) => {
    sheets.spreadsheets.values.get(
      {
        spreadsheetId: sheetId,
        range: 'A2:B1000',
      },
      (err, res) => {
        const rows = res.data.values;
        data.next(rows);
        observ.next(rows);
        observ.complete();
      }
    );
  });
}

function writeValues(auth) {
  const sheets = google.sheets({ version: 'v4', auth });
  return new Observable((observ) => {
    sheets.spreadsheets.values.append(
      {
        spreadsheetId: sheetId,
        range: 'A1',
        valueInputOption: 'RAW',
        requestBody: {
          majorDimension: 'COLUMNS',
          range: 'A1',
          values: [['f'], [6]],
        },
      },
      () => {
        observ.next(true);
        observ.complete();
      }
    );
  });
}

module.exports.data$ = data$;
module.exports.getAuth = getAuth;
module.exports.listMajors = listMajors;
module.exports.valueWrite = valueWrite;
