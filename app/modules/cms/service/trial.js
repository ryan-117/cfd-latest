import path from "path";
const {
  knex,
  // helper: {
  //   utils: { filterImgFromStr, delImg },
  // },
  common: {
    filterImgFromStr, delImg
  }
} = Chan;

let model = "cms_trial";
let db = Chan.Service(knex, model);
const pageSize = 100;

async function getImgsByTrialId(id, arr) {
  const imgStr = ` SELECT img,content FROM cms_trial WHERE id=${id}`;
  const img = await knex.raw(imgStr, []);

  if (img[0].length > 0) {
    if (img[0][0].img) {
      arr.push(img[0][0].img);
    }
    const contImgArr = filterImgFromStr(img[0][0].content);
    for (let i = 0; i < contImgArr.length; i++) {
      arr.push(contImgArr[i]);
    }
  }
}
let TrialService ={
  // 试用列表
  async list(cur = 1, pageSize = 10, id) {
    try {
      // 查询个数
      let sql;
      if (id) {
        sql = `SELECT COUNT(id) as count FROM ${model} WHERE cid IN (${id})`;
      } else {
        sql = `SELECT COUNT(id) as count FROM ${model}`;
      }
      const total = await knex.raw(sql);
      const offset = parseInt((cur - 1) * pageSize);
      let list;
      if (id) {
        list = await knex
          .select()
          .from(model)
          .where("cid", "=", id)
          .limit(pageSize)
          .offset(offset)
          .orderBy("id", "desc");
      } else {
        list = await knex
          .select()
          .from(model)
          .limit(pageSize)
          .offset(offset)
          .orderBy("id", "desc");
      }
      const count = total[0][0].count;
      return {
        count: count,
        total: Math.ceil(count / pageSize),
        current: +cur,
        list: list,
      };
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  // 查
  async detail(id) {
    try {
      // 查询试用
      const data = await knex(model).where("id", "=", id).select();

      //兼容mysql错误
      if (!data[0] || !data[0].cid) {
        return false;
      }
      // 通过栏目id查找模型id
      const modId = await knex.raw(
        `SELECT mid FROM cms_category WHERE id=? LIMIT 0,1`,
        [data[0].cid]
      );

      let field = [];
      if (modId[0].length > 0 && modId[0][0].mid !== "0") {
        // 通过模型查找表名
        const tableName = await knex.raw(
          `SELECT tableName FROM cms_model WHERE id=?`,
          [modId[0][0].mid]
        );
        // 通过表名查找试用
        field = await knex.raw(
          `SELECT * FROM ${tableName[0][0].tableName} WHERE aid=? LIMIT 0,1`,
          [id]
        );
      }

      return { ...data[0], field: field.length > 0 ? field[0][0] : {} };
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  // 搜索
  async search(key = "", cur = 1, pageSize = 10, cid = 0) {
    try {
      // 查询个数
      let sql;
      const countSql = `SELECT COUNT(*) as count FROM  cms_trial a LEFT JOIN cms_category c ON a.id=c.id`;
      const keyStr = ` WHERE a.name LIKE \'%${key}%\'`;
      const cidStr = `  AND c.id=?`;

      if (cid === 0) {
        sql = countSql + keyStr;
      } else {
        sql = countSql + keyStr + cidStr;
      }

      const total = cid ? await knex.raw(sql, [cid]) : await knex.raw(sql, []);
      // 翻页
      const offset = parseInt((cur - 1) * pageSize);
      let sql_list = "";
      const listStart = `SELECT * FROM ${model} a LEFT JOIN cms_category c ON a.id=c.id WHERE a.name LIKE  \'%${key}%\' `;
      const listEnd = `ORDER BY a.id desc LIMIT ${offset},${parseInt(
        pageSize
      )}`;
      if (cid === 0) {
        sql_list = listStart + listEnd;
      } else {
        sql_list = listStart + `AND c.id=? ` + listEnd;
      }

      const list = cid
        ? await knex.raw(sql_list, [cid])
        : await knex.raw(sql_list, []);
      const count = total[0][0].count;
      return {
        count: count,
        total: Math.ceil(count / pageSize),
        current: +cur,
        list: list[0],
      };
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  // 增加计数器
  async count(id) {
    try {
      const result = await knex.raw(
        `UPDATE cms_trial SET pv=pv+1 WHERE id=? LIMIT 1`,
        [id]
      );
      return result[0].affectedRows ? "success" : "fail";
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  // 上一篇试用
  async pre(id, cid) {
    try {
      const result = await knex.raw(
        `SELECT * FROM cms_trial a LEFT JOIN cms_category c ON a.id=c.id  WHERE a.id<? AND a.id=? ORDER BY id DESC LIMIT 1`,
        [id, cid]
      );
      return result[0][0];
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  // 下一篇试用
  async next(id, cid) {
    try {
      const result = await knex.raw(
        `SELECT a.id,a.name,c.name,c.path FROM cms_trial a LEFT JOIN cms_category c ON a.id=c.id WHERE a.id>? AND a.id=? LIMIT 1`,
        [id, cid]
      );
      return result[0][0];
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  // 通过栏目id获取mid，通过mid获取模型对应字段
  async findField(cid) {
    try {
      // 查询个数
      const mid = `SELECT mid FROM cms_category WHERE id=${cid} AND mid IS NOT NULL`;
      const _mid = await knex.raw(mid);
      let res = [];
      if (_mid[0].length > 0) {
        const field = `SELECT cname,ename,type,val,defaultVal,orderBy FROM cms_field WHERE mid=${_mid[0][0].mid} LIMIT 0,12`;
        res = await knex.raw(field);
      }
      return {
        fields: res[0],
      };
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  async tongji() {
    try {
      // 昨天
      // const yesterdayStr =
      //   "select count(*) AS count from cms_trial where TO_DAYS(NOW())-TO_DAYS(updatedAt)<=1";
      // const yesterday = await knex.raw(yesterdayStr);

      //今天
      // const todayStr =
      //   "select count(*) AS count from cms_trial where TO_DAYS(NOW())=TO_DAYS(NOW())";
      // const today = await knex.raw(todayStr);

      // 7天
      const weekStr =
        "SELECT COUNT(*) AS count from cms_trial where DATE_SUB(CURDATE(),INTERVAL 7 DAY)<=DATE(createdAt)";
      const week = await knex.raw(weekStr);

      // 30天
      // const monthStr =
      //   "SELECT COUNT(*) AS count from cms_trial where DATE_SUB(CURDATE(),INTERVAL 30 DAY)<=DATE(updatedAt)";
      // const month = await knex.raw(monthStr);

      //季度
      // const quarterStr =
      //   "SELECT COUNT(*) AS count from cms_trial where QUARTER(createdAt)=QUARTER(NOW())";
      // const quarter = await knex.raw(quarterStr);

      //年
      // const yearStr =
      //   "SELECT COUNT(*) AS count from cms_trial where YEAR(createdAt)=YEAR(NOW())";
      // const year = await knex.raw(yearStr);

      // 留言数
      const messageStr = "SELECT COUNT(id) AS count FROM cms_message LIMIT 0,1";
      const message = await knex.raw(messageStr);

      // tag
      const tagStr = "SELECT COUNT(id) AS count FROM cms_tag LIMIT 0,1";
      const tag = await knex.raw(tagStr);

      // tag
      const TrialStr = "SELECT COUNT(id) AS count FROM cms_trial LIMIT 0,1";
      const Trial = await knex.raw(TrialStr);

      return {
        // yesterday: yesterday[0][0].count,
        // today: today[0][0].count,
        week: week[0][0].count,
        // month: month[0][0].count,
        // quarter: quarter[0][0].count,
        // year: year[0][0].count,
        message: message[0][0].count,
        tag: tag[0][0].count,
        Trial: Trial[0][0].count,
      };
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
}

export default TrialService;
