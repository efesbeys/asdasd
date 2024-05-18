const express = require('express');
const http = require('http');
const bookman = require("bookman");
const handlebars = require("express-handlebars");
const url = require("url");
const Discord = require("discord.js");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const handlebarshelpers = require("handlebars-helpers")();
const path = require("path");
const fs = require('fs');
const passport = require("passport");
const { Strategy } = require("passport-discord");
const session = require("express-session");
const client = new Discord.Client();
const randomString = require("random-string");
const db = (global.db = {});

let ranks = ["normal", "altin", "elmas", "hazir","sistemler", "topluluk", "api"];
for (let rank in ranks) {
  db[ranks[rank]] = new bookman(ranks[rank]);
}


const IDler = {
  botID: "908447284113571880",
  botSecret: "HypGFGIDxIDpPXuaze7m_NmeGOVZD_ky",
  botCallbackURL: "https://happycodeshare.glitch.me/callback",
  sunucuID: "828533376100073482",
  sunucuDavet: "https://discord.gg/tRs5AHgq5x",
  kodLogKanalı: "926898143763775568",
  sahipRolü: "916751811195576420",
  adminRolü: "916751813003337758",
  kodPaylaşımcıRolü: "926897861709410364",
  boosterRolü: "909011437937111040",
  kodPaylaşamayacakRoller: ["926897668167458826", "926897668167458826"],
  hazırAltyapılarRolü: "926897296220762142",
  hazırSistemlerRolü: "926897296220762142",
  sistemlerrolü: "926897296220762142",
  elmasKodlarRolü: "926897296220762142",
  altinKodlarRolü: "926897296220762142",
  normalKodlarRolü: "926897296220762142"
};

const app = express();




app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: false
  })
);
app.use(cookieParser());
app.engine(
  "handlebars",
  handlebars({
    defaultLayout: "main",
    layoutsDir: `${__dirname}/views/layouts/`,
    helpers: handlebarshelpers
  })
);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "handlebars");
app.use(express.static(__dirname + "/public"));
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj);
});
const scopes = ["identify", "guilds"];
passport.use(
  new Strategy(
    {
      clientID: IDler.botID,
      clientSecret: IDler.botSecret,
      callbackURL: IDler.botCallbackURL,
      scope: scopes
    },
    (accessToken, refreshToken, profile, done) => {
      process.nextTick(() => done(null, profile));
    }
  )
);
app.use(
  session({
    secret: "secret-session-thing",
    resave: false,
    saveUninitialized: false
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.get(
  "/giris",
  passport.authenticate("discord", {
    scope: scopes
  })
);
app.get(
  "/callback",
  passport.authenticate("discord", {
    failureRedirect: "/error"
  }),
  (req, res) => {
    res.redirect("/");
  }
);
app.get("/cikis", (req, res) => {
  req.logOut();
  return res.redirect("/");
});
app.get("/davet", (req, res) => {
  res.redirect(IDler.sunucuDavet);
});

/* SAYFALAR BURADAN İTİBAREN */
app.get("/", (req, res) => {
  res.render("index", {
    user: req.user
  });
});
app.get("/", (req, res) => {
  res.render("videolar", {
    user: req.user
  });
});

app.get("/normal", (req, res) => {
  var data = db.normal.get("kodlar");
  data = sortData(data);
      
  res.render("normal", {
    user: req.user,
    kodlar: data
  });
});
app.get("/normal/:id", (req, res) => {
  if (
    !req.user ||
    !client.guilds.cache.get(IDler.sunucuID).members.cache.has(req.user.id)
  )
    return res.redirect(
      url.format({
        pathname: "/hata",
        query: {
          statuscode: 137,
          message:
            "Kodları Görebilmek İçin Discord Sunucumuza Katılmanız | Siteye Giriş Yapmanız Gerekmektedir."
        }
      })
    );

  var id = req.params.id;
  if (!id) req.redirect("/");
  let data = db.normal.get("kodlar");
  var code = findCodeToId(data, id);
  if (code) {
    res.render("kod", {
      user: req.user,
      kod: code
    });
  } else {
    res.redirect("/");
  }
});
app.get("/altin", (req, res) => {
  var data = db.altin.get("kodlar");
  data = sortData(data);
  res.render("altin", {
    user: req.user,
    kodlar: data
  });
});
app.get("/altin/:id", (req, res) => {
  if (
    !req.user ||
    !client.guilds.cache.get(IDler.sunucuID).members.cache.has(req.user.id)
  )
    return res.redirect(
      url.format({
        pathname: "/hata",
        query: {
          statuscode: 137,
          message:
            "Kodları Görebilmek İçin Discord Sunucumuza Katılmanız | Siteye Giriş Yapmanız Gerekmektedir."
        }
      })
    );

  var id = req.params.id;
  if (!id) req.redirect("/");
  let data = db.altin.get("kodlar");
  var code = findCodeToId(data, id);
  if (code) {
    let guild = client.guilds.cache.get(IDler.sunucuID);
    let member = req.user ? guild.members.cache.get(req.user.id) : null;
    if (
      member &&
      (member.roles.cache.has(IDler.altinKodlarRolü) ||
        member.roles.cache.has(IDler.boosterRolü) ||
        member.roles.cache.has(IDler.sahipRolü) ||
        member.roles.cache.has(IDler.kodPaylaşımcıRolü) ||
        member.roles.cache.has(IDler.adminRolü))
    ) {
      res.render("kod", {
        user: req.user,
        kod: code
      });
    } else {
      res.redirect(
        url.format({
          pathname: "/hata",
          query: {
            statuscode: 501,
            message: "Bu kodu görmek için gerekli yetkiniz yok."
          }
        })
      );
    }
  } else {
    res.redirect("/");
  }
});
app.get("/elmas", (req, res) => {
  var data = db.elmas.get("kodlar");
  data = sortData(data);
  res.render("elmas", {
    user: req.user,
    kodlar: data
  });
});
app.get("/elmas/:id", (req, res) => {
  if (
    !req.user ||
    !client.guilds.cache.get(IDler.sunucuID).members.cache.has(req.user.id)
  )
    return res.redirect(
      url.format({
        pathname: "/hata",
        query: {
          statuscode: 137,
          message:
            "Kodları Görebilmek İçin Discord Sunucumuza Katılmanız | Siteye Giriş Yapmanız Gerekmektedir."
        }
      })
    );

  var id = req.params.id;
  if (!id) req.redirect("/");
  let data = db.elmas.get("kodlar");
  var code = findCodeToId(data, id);
  if (code) {
    let guild = client.guilds.cache.get(IDler.sunucuID);
    let member = req.user ? guild.members.cache.get(req.user.id) : null;
    if (
      member &&
      (member.roles.cache.has(IDler.elmasKodlarRolü) ||
        member.roles.cache.has(IDler.boosterRolü) ||
        member.roles.cache.has(IDler.sahipRolü) ||
        member.roles.cache.has(IDler.kodPaylaşımcıRolü) ||
        member.roles.cache.has(IDler.adminRolü))
    ) {
      res.render("kod", {
        user: req.user,
        kod: code
      });
    } else {
      res.redirect(
        url.format({
          pathname: "/hata",
          query: {
            statuscode: 501,
            message: "Bu Kodu Görmek İçin Gerekli Rolün Yok."
          }
        })
      );
    }
  } else {
    res.redirect("/");
  }
});

app.get("/sistemler", (req, res) => {
  var data = db.sistemler.get("kodlar");
  data = sortData(data);
  res.render("sistemler", {
    user: req.user,
    kodlar: data
  });
});
app.get("/sistemler/:id", (req, res) => {
  if (
    !req.user ||
    !client.guilds.cache.get(IDler.sunucuID).members.cache.has(req.user.id)
  )
    return res.redirect(
      url.format({
        pathname: "/hata",
        query: {
          statuscode: 137,
          message:
            "Kodları Görebilmek İçin Discord Sunucumuza Katılmanız | Siteye Giriş Yapmanız Gerekmektedir."
        }
      })
    );

  var id = req.params.id;
  if (!id) req.redirect("/");
  let data = db.sistemler.get("kodlar");
  var code = findCodeToId(data, id);
  if (code) {
    let guild = client.guilds.cache.get(IDler.sunucuID);
    let member = req.user ? guild.members.cache.get(req.user.id) : null;
    if (
      member &&
      (member.roles.cache.has(IDler.sistemlerrolü) ||
        member.roles.cache.has(IDler.boosterRolü) ||
        member.roles.cache.has(IDler.sahipRolü) ||
        member.roles.cache.has(IDler.kodPaylaşımcıRolü) ||
        member.roles.cache.has(IDler.adminRolü))
    ) {
      res.render("kod", {
        user: req.user,
        kod: code
      });
    } else {
      res.redirect(
        url.format({
          pathname: "/hata",
          query: {
            statuscode: 501,
            message: "Bu kodu görmek için gerekli yetkiniz yok."
          }
        })
      );
    }
  } else {
    res.redirect("/");
  }
});
app.get("/sistemler", (req, res) => {
  var data = db.sistemler.get("kodlar");
  data = sortData(data);
  res.render("sistemler", {
    user: req.user,
    kodlar: data
  });
});
app.get("/sistemler/:id", (req, res) => {
  if (
    !req.user ||
    !client.guilds.cache.get(IDler.sunucuID).members.cache.has(req.user.id)
  )
    return res.redirect(
      url.format({
        pathname: "/hata",
        query: {
          statuscode: 137,
          message:
            "Kodları Görebilmek İçin Discord Sunucumuza Katılmanız | Siteye Giriş Yapmanız Gerekmektedir."
        }
      })
    );

  var id = req.params.id;
  if (!id) req.redirect("/");
  let data = db.sistemler.get("kodlar");
  var code = findCodeToId(data, id);
  if (code) {
    let guild = client.guilds.cache.get(IDler.sunucuID);
    let member = req.user ? guild.members.cache.get(req.user.id) : null;
    if (
      member &&
      (member.roles.cache.has(IDler.sistemlerrolü) ||
        member.roles.cache.has(IDler.boosterRolü) ||
        member.roles.cache.has(IDler.sahipRolü) ||
        member.roles.cache.has(IDler.kodPaylaşımcıRolü) ||
        member.roles.cache.has(IDler.adminRolü))
    ) {
      res.render("kod", {
        user: req.user,
        kod: code
      });
    } else {
      res.redirect(
        url.format({
          pathname: "/hata",
          query: {
            statuscode: 501,
            message: "Bu kodu görmek için gerekli yetkiniz yok."
          }
        })
      );
    }
  } else {
    res.redirect("/");
  }
});
app.get("/hazir", (req, res) => {
  var data = db.hazir.get("kodlar");
  data = sortData(data);
  res.render("hazir", {
    user: req.user,
    kodlar: data
  });
});
app.get("/hazir/:id", (req, res) => {
  if (
    !req.user ||
    !client.guilds.cache.get(IDler.sunucuID).members.cache.has(req.user.id)
  )
    return res.redirect(
      url.format({
        pathname: "/hata",
        query: {
          statuscode: 137,
          message:
            "Kodları Görebilmek İçin Discord Sunucumuza Katılmanız | Siteye Giriş Yapmanız Gerekmektedir."
        }
      })
    );

  var id = req.params.id;
  if (!id) req.redirect("/");
  let data = db.hazir.get("kodlar");
  var code = findCodeToId(data, id);
  if (code) {
    let guild = client.guilds.cache.get(IDler.sunucuID);
    let member = req.user ? guild.members.cache.get(req.user.id) : null;
    if (
      member &&
      (member.roles.cache.has(IDler.hazırSistemlerRolü) ||
        member.roles.cache.has(IDler.boosterRolü) ||
        member.roles.cache.has(IDler.sahipRolü) ||
        member.roles.cache.has(IDler.kodPaylaşımcıRolü) ||
        member.roles.cache.has(IDler.adminRolü))
    ) {
      res.render("kod", {
        user: req.user,
        kod: code
      });
    } else {
      res.redirect(
        url.format({
          pathname: "/hata",
          query: {
            statuscode: 501,
            message: "Bu Kodu Görmek İçin Gerekli Rolünüz Yok."
          }
        })
      );
    }
  } else {
    res.redirect("/");
  }
});
app.get("/topluluk", (req, res) => {
  var data = db.topluluk.get("kodlar");
  data = sortData(data);
  res.render("topluluk", {
    user: req.user,
    kodlar: data
  });
});
app.get("/topluluk/:id", (req, res) => {
  if (
    !req.user ||
    !client.guilds.cache.get(IDler.sunucuID).members.cache.has(req.user.id)
  )
    return res.redirect(
      url.format({
        pathname: "/hata",
        query: {
          statuscode: 137,
          message:
            "Kodları Görebilmek İçin Discord Sunucumuza Katılmanız | Siteye Giriş Yapmanız Gerekmektedir."
        }
      })
    );

  var id = req.params.id;
  if (!id) req.redirect("/");
  let data = db.topluluk.get("kodlar");
  var code = findCodeToId(data, id);
  if (code) {
    res.render("kod", {
      user: req.user,
      kod: code
    });
  } else {
    res.redirect("/");
  }
});
app.get("/profil/:id", (req, res) => {
  let id = req.params.id;
  let member = client.guilds.cache.get(IDler.sunucuID).members.cache.get(id);
  if (!member)
    res.redirect(
      url.format({
        pathname: "/hata",
        query: {
          statuscode: 501,
          message: "Belirtilen Profil Bulunamadı"
        }
      })
    );
  else {
    let perms = {
      altin:
        member.roles.cache.has(IDler.sahipRolü) ||
        member.roles.cache.has(IDler.adminRolü) ||
        member.roles.cache.has(IDler.kodPaylaşımcıRolü) ||
        member.roles.cache.has(IDler.boosterRolü) ||
        member.roles.cache.has(IDler.altinKodlarRolü) ||
        member.roles.cache.has(IDler.hazırSistemlerRolü),
      elmas:
        member.roles.cache.has(IDler.sahipRolü) ||
        member.roles.cache.has(IDler.sahipRolü) ||
        member.roles.cache.has(IDler.kodPaylaşımcıRolü) ||
        member.roles.cache.has(IDler.boosterRolü) ||
        member.roles.cache.has(IDler.elmasKodlarRolü) ||
        member.roles.cache.has(IDler.hazırSistemlerRolü),
      hazir:
        member.roles.cache.has(IDler.sahipRolü) ||
        member.roles.cache.has(IDler.adminRolü) ||
        member.roles.cache.has(IDler.kodPaylaşımcıRolü) ||
        member.roles.cache.has(IDler.boosterRolü) ||
        member.roles.cache.has(IDler.hazırSistemlerRolü) ||
        member.roles.cache.has(IDler.hazırAltyapılarRolü),
      destekçi: member.roles.cache.has(IDler.boosterRolü),
      yetkili:
        member.roles.cache.has(IDler.adminRolü) ||
        member.roles.cache.has(IDler.kodPaylaşımcıRolü), 
      sahip: member.roles.cache.has(IDler.sahipRolü), 
    };
    res.render("profil", {
      user: req.user,
      member: member,
      avatarURL: member.user.avatarURL({dynamic: true}),
      perms: perms,
      stats: db.api.get(`${member.user.id}`)
    });
  }
});

app.get("/sil/:rank/:id", (req, res) => {
  if (req.user) {
    let member = client.guilds.cache
      .get(IDler.sunucuID)
      .members.cache.get(req.user.id);
    if (!member) {
      res.redirect(
        url.format({
          pathname: "/hata",
          query: {
            statuscode: 502,
            message: "Bu Sayfayı Görmek İçin Gerekli Yetkiye Sahip Değilsiniz"
          }
        })
      );
    } else {
      if (
        member.roles.cache.has(IDler.sahipRolü)
      ) {
        let id = req.params.id;
        if (!id) {
          res.redirect(
            url.format({
              pathname: "/hata",
              query: {
                statuscode: 504,
                message: "Bir Kod ID'si Belirtin"
              }
            })
          );
        }
        let rank = req.params.rank;
        if (!rank) {
          res.redirect(
            url.format({
              pathname: "/hata",
              query: {
                statuscode: 504,
                message: "Bir kod bölümü belirtin. (normal, altin, elmas, hazir, topluluk)"
              }
            })
          );
        }

        var rawId = findCodeToId(db[rank].get("kodlar"), id);
        if (!rawId)
          res.redirect(
            url.format({
              pathname: "/hata",
              query: {
                statuscode: 504,
                message: "Böyle bir kod bulunmadı!"
              }
            })
          );
        else {
          if (req.user) db.api.add(`${req.user.id}.silinen`, 1);
          db[rank].delete("kodlar." + rawId.isim);
          res.redirect("/");
        }
      } else {
        res.redirect(
          url.format({
            pathname: "/hata",
            query: {
              statuscode: 502,
              message: "Bu sayfayı görmek için gerekli izne sahip değilsiniz"
            }
          })
        );
      }
    }
  } else {
    res.redirect(
      url.format({
        pathname: "/hata",
        query: {
          statuscode: 501,
          message: "Bu sayfayı görmek için giriş yapmalısınız"
        }
      })
    );
  }
});

app.get("/bilgilendirme", (req, res) => {
  res.render("bilgilendirme", {
    user: req.user
  });
});
app.get("/bakim", (req, res) => {
  res.render("bakim", {
    user: req.user
  });
});

app.get("/paylas", (req, res) => {
  if (
    !req.user ||
    !client.guilds.cache.get(IDler.sunucuID).members.cache.has(req.user.id)
  )
    return res.redirect(
      url.format({
        pathname: "/hata",
        query: {
          statuscode: 138,
          message:
            "Kod paylaşabilmek için Discord sunucumuza katılmanız ve siteye giriş yapmanız gerekmektedir."
        }
      })
    );
  res.render("kod_paylas", {
    user: req.user
  });
});
app.post("/paylasim", (req, res) => {
  let guild = client.guilds.cache.get(IDler.sunucuID);
  let member = req.user ? guild.members.cache.get(req.user.id) : null;
  let rank = "topluluk";
  if (
    member &&
    IDler.kodPaylaşamayacakRoller.some(id => member.roles.cache.has(id))
  )
    return res.redirect(
      url.format({
        pathname: "/hata",
        query: {
          statuscode: 502,
          message: "Kod Paylaşma İznin Yok!"
        }
      })
    );
  if (
    member &&
    (member.roles.cache.has(IDler.sahipRolü) ||
      member.roles.cache.has(IDler.kodPaylaşımcıRolü) ||
      member.roles.cache.has(IDler.adminRolü))
  )
    rank = req.body.kod_rank;

  let auht = [];
  if (req.user) auht.push(req.user);
  let auth_arr = req.body.author.split(",");

  auth_arr.forEach(auth => {
    let user = client.users.cache.get(auth);
    auht.push(req.user);
  });

  let obj = {
    author: req.auth,
    isim: req.body.kod_adi,
    id: randomString({ length: 10 }),
    desc: req.body.desc,
    modules: req.body.modules.split(","),
    icon: req.user
      ? `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png`
      : `https://cdn.discordapp.com/icons/${IDler.sunucuID}/a_830c2bcfa4f1529946e82f15441a1227.jpg`,
    main_code: req.body.main_code,
    komutlar_code: req.body.komutlar_code,
    kod_rank: rank,
    k_adi: req.user.username,
    date: new Date(Date.now()).toLocaleDateString()
  };
  let kodrank = obj.kod_rank.replace("normal", "BDFD").replace("altin", "Aoi.js").replace("elmas", "JavaScript").replace("hazir", "Hazır Altyapı").replace("topluluk", "Sizden Gelenler (Topluluk)")
  if (req.user) db.api.add(`${req.user.id}.paylasilan`, 1);
  db[obj.kod_rank].set(`kodlar.${obj.isim}`, obj);
  client.channels.cache.get(IDler.kodLogKanalı).send(
    new Discord.MessageEmbed()
    .setColor("#0073FF")
    .setFooter(client.guilds.cache.get(IDler.sunucuID).name, client.guilds.cache.get(IDler.sunucuID).iconURL({ dynamic: true, size: 2048}))
    .setTimestamp()
    .setAuthor("Bir Kod Paylaşıldı!",client.user.avatarURL)
    .addField("Kod Bilgileri",`**Adı:** ${obj.isim} \n**Açıklaması:** ${obj.desc} \n**Bölümü:** ${kodrank} \n**Paylaşan:** ${obj.k_adi}`)
    .addField("Kod Sayfası", `[Tıkla!](https://happycodeshare.glitch.me/${obj.kod_rank}/${obj.id})`));
  res.redirect(`/${obj.kod_rank}/${obj.id}`);
});

function findCodeToId(data, id) {
  var keys = Object.keys(data);
  keys = keys.filter(key => data[key].id == id)[0];
  keys = data[keys];
  return keys;
}

function sortData(object) {
  var keys = Object.keys(object);
  var newData = {};
  var arr = [];
  keys.forEach(key => {// sup pothc :)
    arr.push(key);
  });
  arr.reverse();
  arr.forEach(key => {
    newData[key] = object[key];
  })
  return newData;
}

app.get("/hata", (req, res) => {
  res.render("hata", {
    user: req.user,
    statuscode: req.query.statuscode,
    message: req.query.message
  });
});

app.use((req, res) => {
  const err = new Error("Not Found");
  err.status = 404;
  return res.redirect(
    url.format({
      pathname: "/hata",
      query: {
        statuscode: 404,
        message: "Sayfa Bulunamadı"
      }
    })
  );
});

client.login(process.env.token);


client.on("ready", () => {
  const listener = app.listen(process.env.PORT, function() {
    client.user.setActivity(`Happy Code Share`, { type:"WATCHING" })
    console.log("Proje Hazır!");
  });
});
