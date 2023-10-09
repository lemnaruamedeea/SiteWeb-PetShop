const express = require("express");
const fs= require('fs');
const path=require('path');
const sharp=require('sharp');
const sass=require('sass');
const ejs=require('ejs');
const {Client}=require('pg');


var client= new Client({database:"petshop",
        user:"lemnaruamedeea",
        password:"1234",
        host:"localhost",
        port:5432});
client.connect();


client.query("select * from hrana_caini ", function(err, rez){
    console.log("Eroare BD", err);
    console.log("Rezultat BD", rez)
});


obGlobal={
    obErori:null,
    obImagini:null,
    folderScss: path.join(__dirname, "resurse/scss"),
    folderCss: path.join(__dirname, "resurse/css"),
    folderBackup: path.join(__dirname, "backup"),
    optiuniMeniu:[]
}
app= express();
console.log("Folder proiect", __dirname);
console.log("Cale fisier", __filename);
console.log("Director de lucru", process.cwd());

client.query("select * from unnest(enum_range(null::tipuri_hrana))", function(err, rezTipuri){
    if(err){
        console.log(err);
    }
    else{
        obGlobal.optiuniMeniu=rezTipuri.rows;
    }
});

vectorFoldere=["temp", "temp1","backup"]
for (let folder of vectorFoldere){
    let caleFolder=path.join(__dirname, folder)
    if (! fs.existsSync(caleFolder)){
        fs.mkdirSync(caleFolder);
    }

}

app.set("view engine","ejs");

app.use("/resurse", express.static(__dirname+"/resurse"));

app.use("/node_modules", express.static(__dirname+"/node_modules"));

app.use("/*",function(req, res, next){
    res.locals.optiuniMeniu=obGlobal.optiuniMeniu; //adaug optiuniMeniu in locals
    next(); //vreau sa nu se opreasca la prima care se potriveste, asa ca folosesc next ca sa trec prin toate
})

app.use(/^\/resurse(\/[a-zA-Z0-9]*)*$/, function(req,res){
    afisareEroare(res,403);
});

app.get("/favicon.ico", function(req,res){
    res.sendFile(__dirname+"/resurse/imagini/favicon.ico");
})

app.get(["/index","/","/home" ], function(req, res){
    res.render("pagini/index" , {ip: req.ip, imagini:obGlobal.obImagini.imagini});
})

app.get("/despre", function(req, res){
    res.render("pagini/despre");
})

app.get("/produse",function(req, res){
    //TO DO query pentru a selecta toate produsele
    //TO DO se adauaga filtrarea dupa tipul produsului
    //TO DO se selecteaza si toate valorile din enum-ul categ_prajitura
    
    client.query("select * from unnest(enum_range(null::categ_hrana))", function(err, rezCategorie){
        if(err){
            console.log(err);
        }
        else{
        let conditieWhere="";
        if(req.query.tip)
            conditieWhere=` where tip_hrana='${req.query.tip}'`
        client.query("select * from hrana_caini"+conditieWhere , function( err, rez){
            console.log(300)
            if(err){
                console.log(err);
                afisareEroare(res, 2);
            }
            else{
                console.log(rez);
                res.render("pagini/produse", {produse:rez.rows, optiuni:rezCategorie.rows});
            }
        });
    }
    })


});


app.get("/produs/:id",function(req, res){
    console.log(req.params);
   
    client.query(`select * from hrana_caini where id=${req.params.id}`, function( err, rezultat){
        if(err){
            console.log(err);
            afisareEroare(res, 2);
        }
        else
            res.render("pagini/produs", {prod:rezultat.rows[0]});
    });
});


///////// EXAMEN //////
app.get("/extraterestri",function(req, res){
    client.query("select * from extraterestri", function( err, rez){
            
        if(err){
            console.log(err);
            afisareEroare(res, 2);
        }
        else{
            console.log(rez);
            res.render("pagini/extraterestri", {extraterestri:rez.rows});
        }
    });
})


app.get("/extraterestri",function(req, res){
        
        client.query("select nume from extraterestri", function(err, rezCategorie){
            if(err){
                console.log(err);
            }
            else{
            let conditieWhere="";
            if(req.query.nume)
                conditieWhere=` where nume='${req.query.nume}'`
            client.query("select * from extraterestri"+conditieWhere , function( err, rez){
                console.log(300)
                if(err){
                    console.log(err);
                    afisareEroare(res, 2);
                }
                else{
                    console.log(rez);
                    res.render("pagini/extraterestri", {extraterestri:rez.rows, optiuni:rezCategorie.rows});
                }
            });
        }
        })
    
    
    });



app.get("/*.ejs",function(req, res){
    afisareEroare(res,400);
})

app.get("/*",function(req, res){
    try{
        res.render("pagini"+req.url, function(err, rezRandare){
            if(err){
                console.log(err);
                if(err.message.startsWith("Failed to lookup view"))
                    afisareEroare(res,404, "ceva");
                else
                    afisareEroare(res);
            }
            else{
                console.log(rezRandare);
                res.send(rezRandare);
            }
        } );
    } catch(err){
        if(err.message.startsWith("Cannot find module"))
        //afisareEroare(res,{_identificator:404, _titlu:"ceva"});
            afisareEroare(res,404);
        else
            afisareEroare(res);
    }
})

function initErori(){
    var continut= fs.readFileSync(__dirname+"/resurse/json/erori.json").toString("utf-8");
    obGlobal.obErori=JSON.parse(continut);
    let vErori=obGlobal.obErori.info_erori;
    for (let eroare of vErori){
        eroare.imagine="/"+obGlobal.obErori.cale_baza+"/"+eroare.imagine;
    }
}
initErori();

function afisareEroare(res, _identificator, _titlu, _text, _imagine){
    let vErori=obGlobal.obErori.info_erori;
    let eroare=vErori.find(function(elem) {return elem.identificator==_identificator;} )
    if(eroare){
        let titlu1= _titlu || eroare.titlu;
        let text1= _text || eroare.text;
        let imagine1= _imagine || eroare.imagine;
        if(eroare.status)
            res.status(eroare.identificator).render("pagini/eroare", {titlu:titlu1, text:text1, imagine:imagine1});
        else
            res.render("pagini/eroare", {titlu:titlu1, text:text1, imagine:imagine1});
    }
    else{
        let errDef=obGlobal.obErori.eroare_default;
        res.render("pagini/eroare", {titlu:errDef.titlu, text:errDef.text, imagine:+obGlobal.obErori.cale_baza+"/"+errDef.imagine});
    }
    

}

function compileazaScss(caleScss, caleCss){
    console.log("cale:",caleCss);
    if(!caleCss){
        let vectorCale=caleScss.split("\\")
        let numeFisExt=vectorCale[vectorCale.length-1];

        let numeFis=numeFisExt.split(".")[0]   /// "a.scss"  -> ["a","scss"]
        caleCss=numeFis+".css";
    }
    
    if (!path.isAbsolute(caleScss))
        caleScss=path.join(obGlobal.folderScss,caleScss )
    if (!path.isAbsolute(caleCss))
        caleCss=path.join(obGlobal.folderCss,caleCss )
    
    
    let vectorCale=caleCss.split("\\");
    let numeFisCss=vectorCale[vectorCale.length-1];
    if (fs.existsSync(caleCss)){
        fs.copyFileSync(caleCss, path.join(obGlobal.folderBackup,numeFisCss ))// +(new Date()).getTime()
    }
    rez=sass.compile(caleScss, {"sourceMap":true});
    fs.writeFileSync(caleCss,rez.css)
    console.log("Compilare SCSS",rez);
}

vFisiere=fs.readdirSync(obGlobal.folderScss);
for( let numeFis of vFisiere ){
    if (path.extname(numeFis)==".scss"){
        compileazaScss(numeFis);
    }
}

fs.watch(obGlobal.folderScss, function(eveniment, numeFis){
    console.log(eveniment, numeFis);
    if (eveniment=="change" || eveniment=="rename"){
        let caleCompleta=path.join(obGlobal.folderScss, numeFis);
        if (fs.existsSync(caleCompleta)){
            compileazaScss(caleCompleta);
        }
    }
})


function initImagini(){
    var continut= fs.readFileSync(__dirname+"/resurse/json/galerie.json").toString("utf-8");

    obGlobal.obImagini=JSON.parse(continut);
    let vImagini=obGlobal.obImagini.imagini;

    let caleAbs=path.join(__dirname,obGlobal.obImagini.cale_galerie);
    let caleAbsMediu=path.join(__dirname,obGlobal.obImagini.cale_galerie, "mediu");
    if (!fs.existsSync(caleAbsMediu))
        fs.mkdirSync(caleAbsMediu);

    //for (let i=0; i< vErori.length; i++ )
    for (let imag of vImagini){
        [numeFis, ext]=imag.fisier.split(".");
        let caleFisAbs=path.join(caleAbs,imag.fisier);
        let caleFisMediuAbs=path.join(caleAbsMediu, numeFis+".webp");
        sharp(caleFisAbs).resize(400).toFile(caleFisMediuAbs);
        imag.fisier_mediu=path.join("/", obGlobal.obImagini.cale_galerie, "mediu",numeFis+".webp" )
        imag.fisier=path.join("/", obGlobal.obImagini.cale_galerie, imag.fisier )
        //eroare.imagine="/"+obGlobal.obErori.cale_baza+"/"+eroare.imagine;
    }
}
initImagini();


app.listen(8080);
console.log("Serverul a pornit");