const fs = require('fs');
const path = require('path');
const math = require('math');
const FindFiles = require('./file-regex.js');
const LEFT = 37,
      UP = 38,
      RIGHT = 39,
      DOWN = 40,
      ENTER = 13,
      ESC = 27;

var arr = [], arr2 = [], find = [], find_num = [];
var start, end, cur, cur2, page;
var folder_name, choose_folder, search, if_single, text;
function init() {
    start = end = cur = 0;
    page = 0;
    choose_folder = true;
    search = false;
    if_single = false;
    arr = [], arr2 = [];
}
init();
function get_folder(name) {
    init();
    folder_name = name;
    var photo_cnt = 0;
    fs.readdir(name, (err, files) => {
        if (err)
            return;
        files = files.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item));
        document.getElementById('drop').style.display = 'none';
        end = files.length;
        files = files.map(function (fileName) {
            if (fileName.indexOf('jpg') !== -1 || fileName.indexOf('png') !== -1)
                photo_cnt++;
            return {
              name: fileName,
              time: fs.statSync(name + '/' + fileName).mtime.getTime()
            };
        }).sort(function (a, b) {
            return b.time - a.time;
        }).map(function (v) {
            return v.name;
        });
        arr = files;
        if (photo_cnt > end / 2) {
            arr2 = arr;
            arr2.sort(cmp);
            arr = [];
            if_single = true;
            image(0, arr, 0);
        }else
            folder(arr, 0);
    });
}
async function folder(arr, name) {
    if (search)
        document.getElementById('input').value = text + ': ' + arr[name];
    else
        document.getElementById('holder').innerText = arr[name];
    var p = path.join(folder_name, arr[name]);
    const result = await FindFiles(p, /^1\..*/);
    show_image(path.join(p, result[0].file));
}
function image(cnt, arr, cur) {
    var title = path.basename(folder_name);
    if (arr[cur] !== undefined)
        title = arr[cur];
    var p = folder_name;
    if (arr[cur] !== undefined)
        p = path.join(folder_name, arr[cur]);
    console.log(p,  arr2[0]);
    if (search)
        document.getElementById('input').value = text + `: ${title} ${arr2[cnt]}`;
    else
        document.getElementById('holder').innerText = title + `  ${arr2[cnt]}`;

    show_image(path.join(p, arr2[cnt]));
}
document.getElementById('body').addEventListener('keyup', function(event) {
    var press = event.keyCode;
    // console.log(event);
    if (search) {
        if (!choose_folder) {
            view_photo(find, cur2, press);
        }else if (find.length === 0 && press === ENTER) {
            text = document.getElementById('input').value;
            var reg = new RegExp(text.toUpperCase());
            document.activeElement.blur();
            find = [];
            find_num = [];
            for (var start = 0; start < arr.length; start++) {
                if (arr[start].toUpperCase().match(reg)) {
                    find.push(arr[start]);
                    find_num.push(start);
                }
            }
            if (find.length !== 0) {
                cur2 = 0;
                folder(find, 0);
                return;
            }
            toggle_hide();
            search = false;
        }else if (find.length !== 0) {
            switch(press) {
                case LEFT:
                case UP:
                    if (cur2 > 0)
                        cur2--;
                    folder(find, cur2);
                    break;
                case RIGHT:
                case DOWN:
                    if (cur2 < find.length - 1)
                        cur2++;
                    folder(find, cur2);
                    break;
                case ENTER:
                    arr2 = [];
                    choose_folder = false;
                    fs.readdir(path.join(folder_name, find[cur2]), (err, files) => {
                        files = files.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item));
                        files.forEach(file => {
                            console.log(file);
                            arr2.push(file);
                        });
                        arr2.sort(cmp);
                        image(0, find, cur2);
                    });
                    page = 0;
                    return;
                case ESC:
                    find = [];
                    toggle_hide();
                    search = false;
                    folder(arr, cur = find_num[cur2]);
            }
        }else if (press === ESC) {
            search = false;
            toggle_hide();
        }
    }else if (choose_folder && !if_single) {
        switch(press) {
            case LEFT:
            case UP:
                if (cur > 0)
                    cur--;
                folder(arr, cur);
                break;
            case RIGHT:
            case DOWN:
                if (cur < end -1)
                    cur++;
                folder(arr, cur);
                break;
            case ENTER:
                choose_folder = false;
                arr2 = [];
                fs.readdir(path.join(folder_name, arr[cur]), async (err, files) => {
                    files = files.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item));
                    files.forEach(file => {
                        // console.log(file);
                        arr2.push(file);
                    });
                    arr2.sort(cmp);
                    image(0, arr, cur);
                });
                page = 0;
                return;
            case 70: // F(ind)
                if ((event.metaKey || event.ctrlKey) && !if_single)
                    toggle_hide();
                break;
            case 82: // R(andom)
                folder(arr, cur = getRandom(0, end - 1));
                break;
            case 83: // S(huffle)
                shuffle(arr);
                folder(arr, cur);
        }
    }else {
        view_photo(arr, cur, press);
    }
});
function show_image(src) {
    
    fs.readFile(src, function(err, data) {
        var img = document.createElement('img');
        img.src = 'data:image/png;base64, ' + data.toString('base64');
        img.id = 'img';
        var target = document.getElementById('img');
        if (target !== null) {
            console.log('Remove');
            target.remove();
        }
        document.body.appendChild(img);
    })
}
function toggle_hide() {
    var o = document.getElementById('holder');
    var i = document.getElementById('send');
    if (o.style.display === 'none') {
        o.style.display = 'block';
        i.style.display = 'none';
        search = false;
    } else {
        document.getElementById('input').value = '';
        o.style.display = 'none';
        i.style.display = 'block';
        document.getElementById('input').focus();
        search = true;
    }
}
function view_photo(arr, cur, press) {
    switch(press) {
        case LEFT:
        case UP:
            if (page > 0)
                image(--page, arr, cur);
            break;
        case RIGHT:
        case DOWN:
            if (page < arr2.length - 1)
                image(++page, arr, cur);
            break;
        case ESC:
        case ENTER:
            choose_folder = true;
            if (!if_single)
                folder(arr, cur);
            break;
    }
}
function getRandom(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

function shuffle(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
function cmp(a, b) {
    a = a.replace(/\.[^/.]+$/, ""); a = parseInt(a);
    b = b.replace(/\.[^/.]+$/, ""); b = parseInt(b);
    return a < b ? -1 : 1;
}