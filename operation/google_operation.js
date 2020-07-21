const { Observable, Subject } = require('rxjs');
const { switchMap } = require('rxjs/operators');
const { google } = require('googleapis');
const connector = require('./google_connector');

const sheetId = '1o8G4tBCicfVgqMp2Y6tWV5j8GOXfsgOk4pzg4Eo_VLQ';
const data = new Subject();
const data$ = connector.getAuth().pipe(switchMap(listMajors));

const valueWrite = new Subject();
const valueWrite$ = valueWrite.pipe(connector.getAuthOperator(), writeValuesOperator());

function listMajors(auth) {
  const sheets = google.sheets({ version: 'v4', auth });
  return new Observable((observ) => {
    sheets.spreadsheets.values.get(
      {
        spreadsheetId: sheetId,
        range: 'A2:D1000',
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

function writeValuesOperator() {
  return (prev) =>
    new Observable((observ) => {
      prev.subscribe((paramList) => {
        const val = paramList[0];
        const auth = paramList[1];
        const sheets = google.sheets({ version: 'v4', auth });
        sheets.spreadsheets.values.append(
          {
            spreadsheetId: sheetId,
            range: 'A1',
            valueInputOption: 'RAW',
            requestBody: {
              majorDimension: 'COLUMNS',
              range: 'A1',
              values: [
                [val.storeName],
                [val.suggestMenu],
                [val.worstMenu],
                [val.score],
              ],
            },
          },
          () => {
            observ.next(true);
            observ.complete(true);
          }
        );
      });
    });
}

module.exports.data = data;
module.exports.data$ = data$;
module.exports.valueWrite = valueWrite;
module.exports.valueWrite$ = valueWrite$;
