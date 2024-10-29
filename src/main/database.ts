/* eslint-disable prettier/prettier */
import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('F:\\NODEJS\\Node_project\\quan_li_baiviet\\src\\main/sql.sqlite', (err) => {
  if (err) {
    console.error('loi khi mo database:', err.message);
  } else {
    console.log('ket noi sql thanh cong.');
  }
});

// Hàm chèn dữ liệu vào bảng (Insert)
export function insertData(
  table: string,
  columns: string[],
  values: any[],
  callback: (err: Error | null, lastID: number | null) => void
) {
  const placeholders = columns.map(() => '?').join(',');
  const sql = `INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`;

  db.run(sql, values, function (err) {
    callback(err, this?.lastID || null);
  });
}

// Hàm truy vấn dữ liệu từ bảng (Select)
export function queryData(
  sql: string,
  params: any[],
  callback: (err: Error | null, rows: any[] | null) => void
) {
  db.all(sql, params, (err, rows) => {
    callback(err, rows);
  });
}

// Hàm cập nhật dữ liệu (Update)
export function updateData_nowhere(
  values: any[],
  callback: (err: Error | null) => void
) {
  const sql = `UPDATE setting_tb SET kw = ?, url = ?, couldnt_find = ? , postElements = ? , title = ? , href = ? , content = ?`;
  db.run(sql, values, (err) => {
    callback(err);
  });
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function deleteData(id: number, callback: (err: Error | null) => void) {
    if(id){
        const sql = `DELETE FROM posts WHERE id_post = ?`;
        db.run(sql, id, (err) => {
            callback(err);
        });}
    else{
        const sql = `DELETE FROM posts`;
        db.run(sql,  (err) => {
            callback(err);
        })

    }

}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function savePostsToDatabase(posts: any[], callback: (err: Error | null) => void) {
  let id_post = Date.now();
  for (const post of posts) {
    id_post += 1;
    const columns = ["id_post", "title", "href", "id", "content"];
    const values = [
      id_post,
      post.title,
      post.href,
      post.id,
      `"${post.content}"`,
    ];
    insertData("posts", columns, values, (err, lastID) => {
      if (err) {
        console.error("Error inserting data:", err.message);
      } else {
        console.log(`Post inserted with ID: ${id_post}`);
      }
    });
  }
  callback(null);
}

// Hàm gửi thiết lập từ cơ sở dữ liệu (Settings)
export function sendSettingsFromDatabase(callback: (err: Error | null, settings: any | null) => void) {
  const sql = `SELECT kw, url, couldnt_find, postElements, title, href, content FROM setting_tb`;
  queryData(sql, [], (err, rows) => {
    if (err) {
      callback(err, null);
    } else {
      const settings = rows[0] || {
        kw: "",
        url: "",
        couldnt_find: "",
        postElements: "",
        title: "",
        href: "",
        content: "",
      };
      callback(null, settings);
    }
  });
}
