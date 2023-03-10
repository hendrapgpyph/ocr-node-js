const express = require('express');
const multer = require('multer');
const app = express();
const fs = require('fs');
var Tesseract = require('tesseract.js');
const cv = require('opencv4nodejs');


// middlewares
app.use(express.urlencoded({ extended : true }));
app.use(express.json());

const PORT = process.env.PORT | 5001;

var Storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, "images/")
    },
    filename : (req, file, callback) => {
        var extension = file.originalname.split('.').pop();
        var filename = (new Date()).getTime()+"."+extension;
        callback(null, filename)
    }
});

var upload = multer({
    storage: Storage
}).array('image');


app.post('/', (req, res) => {});

app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        var filename = req.files[0].filename;
        if(err) {
            return res.send("Something going wrong")
        }
        const originalImage = cv.imread(__dirname+"/images/"+filename);
        var convert1 = cv.convertScaleAbs(originalImage, 0.8, 0);
        var convert2 = convert1.bgrToGray();
        var threshold = convert2.threshold(127, 255, cv.THRESH_TRUNC);
        cv.imwrite(__dirname+"/images/convert_"+filename, threshold);

        var image = fs.readFileSync(__dirname+"/images/convert_"+filename, {
            encoding: null
        });

        Tesseract.recognize(
            image,
            'eng',
            // { logger: m => console.log(m) }
          ).then(({ data: { text } }) => {
            var result = {
                nik : "",
                nama : "",
                tempat : "",
                tanggal : "",
                alamat : "",
                kecamatan : "",
                kewarganegaraan : "",
                agama : "",
                perkawinan : "",
                kelurahan_atau_desa : "",
                pekerjaan : "",
                rt : "",
                rw : "",
            };
            text.split("\n").forEach(value => {
                let word = value;
                if (value.includes("NIK")){
                    word = word.replace("*",":");
                    word = word.split(':');
                    let word_fix = word[word.length-1];
                    word_fix = word_fix.replace(" ","")
                    word_fix = word_fix.replace("?","7")
                    word_fix = word_fix.replace("L","1")
                    word_fix = word_fix.replace("l","1")
                    word_fix = removeSpaceFirstLetter(word_fix);
                    word_fix = word_fix.replace(/\D/g,'');
                    result.nik = word_fix;
                }else if(value.includes("Nama") || value.includes("Name")){
                    word = word.split(':')
                    let word_fix = word[word.length-1];
                    word_fix = word_fix.replace('Nama ','')
                    word_fix = word_fix.replace('Nama.  ','')
                    word_fix = word_fix.replace('Name ','')
                    word_fix = word_fix.replace('Name.','')
                    word_fix = word_fix.replace('1','I')
                    word_fix = removeSpaceFirstLetter(word_fix);
                    word_fix = word_fix.replace(/[^\w\s]/gi, '')
                    result.nama = word_fix
                }else if(value.includes("Tempat")){
                    word = word.split(':')
                    let ttl = word[word.length-1];
                    ttl = ttl.split(",");
                    // tempat lahir
                    let tempat = ttl[0];
                    tempat = removeSpaceFirstLetter(tempat);
                    result.tempat = tempat;
                    // tgl lahir
                    let tanggal = ttl[1];
                    tanggal = removeSpaceFirstLetter(tanggal);
                    result.tanggal = tanggal;
                }else if(value.includes("Darah")){
                    // cari kelamin
                    var array_kelamin = ["LAKI-LAKI","LAKI","LELAKI","PEREMPUAN"];
                    var kelamin_fix = "";
                    array_kelamin.forEach(kelamin => {
                        if(kelamin_fix == "" && value.includes(kelamin)){
                            kelamin_fix = kelamin;
                        }
                    });
                    // cari golongan darah
                    word = word.split(':');
                    var darah_fix = "";
                    if(word.length == 3){
                        var darah_dapet = word[2];
                        var array_darah = ["AB","O","A","B"];
                        array_darah.forEach(darah => {
                            if(darah_fix == "" && darah_dapet.includes(darah)){
                                darah_fix = darah;
                            }
                        });
                    }
                    
                    kelamin_fix = removeSpaceFirstLetter(kelamin_fix);
                    result.kelamin = kelamin_fix;
                    darah_fix = removeSpaceFirstLetter(darah_fix);
                    result.golongan_darah = darah_fix;
                }else if(value.includes("Alamat")){
                    // cari alamat
                    let alamat = value.replace("Alamat : ","");
                    alamat = alamat.replace("Alamat ","");
                    alamat = removeSpaceFirstLetter(alamat);
                    result.alamat = alamat;
                }else if(value.includes("NO.")){
                    // cari nomor tambahin di alamat
                    result.alamat = result.alamat+" "+value;
                }else if(value.includes("Kecamatan")){
                    // cari kecamatan
                    word = word.split(':')
                    let kecamatan = word[word.length-1];
                    kecamatan = removeSpaceFirstLetter(kecamatan);
                    result.kecamatan = kecamatan;
                }else if(value.includes("Kewarganegaraan")){
                    // cari Kewarganegaraan
                    word = word.split(':')
                    let kewarganegaraan = word[word.length-1];
                    kewarganegaraan = removeSpaceFirstLetter(kewarganegaraan);
                    result.kewarganegaraan = kewarganegaraan;
                }else if(value.includes("Agama")){
                    // cari Agama
                    word = word.replace("-",":")
                    word = word.split(':')
                    let agama = word[word.length-1];
                    agama = removeSpaceFirstLetter(agama);
                    result.agama = agama;
                }else if(value.includes("Perkawinan")){
                    // cari Perkawinan
                    word = word.split(':')
                    let perkawinan = word[word.length-1];
                    perkawinan = removeSpaceFirstLetter(perkawinan);
                    result.perkawinan = perkawinan;
                }else if(value.includes("Desa")){
                    // cari Desa / kelurahan
                    word = word.split(':')
                    let desa = word[word.length-1];
                    desa = removeSpaceFirstLetter(desa);
                    result.kelurahan_atau_desa = desa;
                }else if(value.includes("Pekerjaan")){
                    // cari Pekerjaan
                    word = word.split(':')
                    let pekerjaan = word[word.length-1];
                    pekerjaan = removeSpaceFirstLetter(pekerjaan);
                    result.pekerjaan = pekerjaan;
                }else if(value.includes("RTRW") || value.includes("RT/RW")){
                    word = word.replace("RTRW",'')
                    word = word.replace("RT/RW","")
                    word = word.replace("!","/")
                    if(word.split('/').length > 1){
                        result.rt = removeSpaceFirstLetter(word.split('/')[0]);
                        result.rw = removeSpaceFirstLetter(word.split('/')[1]);
                    }else{
                        result.rt = removeSpaceFirstLetter(word.substring(0,2));
                        result.rw = removeSpaceFirstLetter(word.substring(2,4));
                    }
                }
            });

            try {
                fs.unlinkSync('images/'+filename);
                fs.unlinkSync('images/convert_'+filename);
            } catch (error) {
                console.log(error);
            }

            return res.json({
                convert : result,
                text : text
            });
        });
    })
});

app.listen(PORT, () => {
    console.log("Server running on port "+PORT)
});

removeSpaceFirstLetter = (value) => {
    var data = value.split("");
    var fix = value;
    if(data.length > 0){
        if(data[0] == ' '){
            fix = fix.substring(1);
        }
    }

    return fix;
}