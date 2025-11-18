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
  async list(cur = 1, pageSize = 10) {
    try {
      const current = Math.max(parseInt(cur) || 1, 1);
      const size = Math.max(parseInt(pageSize) || 10, 1);
      const offset = (current - 1) * size;

      const total = await knex(model).count({ count: "id" });
      const list = await knex(model)
        .select()
        .orderBy("id", "desc")
        .limit(size)
        .offset(offset);

      const count = Number(total[0].count || total[0]["count(*)"] || 0);
      return {
        count,
        total: Math.ceil(count / size),
        current,
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
      const data = await knex(model).where("id", "=", id).first();
      return data || null;
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  // 搜索
  async search(key = "", cur = 1, pageSize = 10) {
    try {
      const current = Math.max(parseInt(cur) || 1, 1);
      const size = Math.max(parseInt(pageSize) || 10, 1);
      const offset = (current - 1) * size;

      const baseQuery = knex(model);
      if (key) {
        baseQuery.where("name", "like", `%${key}%`);
      }

      const total = await baseQuery.clone().count({ count: "id" });
      const list = await baseQuery
        .clone()
        .orderBy("id", "desc")
        .limit(size)
        .offset(offset);
      const count = Number(total[0].count || total[0]["count(*)"] || 0);

      return {
        count,
        total: Math.ceil(count / size),
        current,
        list,
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
  async pre(id) {
    try {
      const result = await knex(model)
        .select("id", "name")
        .where("id", "<", id)
        .orderBy("id", "desc")
        .first();
      return result || null;
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  // 下一篇试用
  async next(id) {
    try {
      const result = await knex(model)
        .select("id", "name")
        .where("id", ">", id)
        .orderBy("id", "asc")
        .first();
      return result || null;
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  // 通过栏目id获取mid，通过mid获取模型对应字段
  async findField(cid) {
    return {
      fields: [],
    };
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
