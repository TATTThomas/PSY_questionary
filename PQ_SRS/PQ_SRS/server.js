var http = require('http'),
    fs = require('fs'),
    url = require('url');
//const local_path = "127.0.0.1";
//const local_port = 1337; 
//const local_uri = 'http://127.0.0.1:1337/';
const local_port = 1339; 
const local_uri = 'http://127.0.0.1:1339/';

http.createServer(function (req, res) {
    var parseObj = url.parse(req.url, true);
    req.query = parseObj.query;
    try {
        if (req.headers['range']) {
            var path = req.query.path;
            var stat = fs.statSync(path);
            var total = stat.size;
            var range = req.headers.range;
            var parts = range.replace(/bytes=/, "").split("-");
            var partialstart = parts[0];
            var partialend = parts[1];

            var start = parseInt(partialstart, 10);
            var end = partialend ? parseInt(partialend, 10) : total - 1;
            var chunksize = (end - start) + 1;
            console.log('RANGE: ' + start + ' - ' + end + ' = ' + chunksize);

            var file = fs.createReadStream(path, { start: start, end: end });
            res.writeHead(206, { 'Content-Range': 'bytes ' + start + '-' + end + '/' + total, 'Accept-Ranges': 'bytes', 'Content-Length': chunksize, 'Content-Type': 'video/mp4' });
            file.pipe(res);
        } else {
            var path = req.query.path;
            var stat = fs.statSync(path);
            var total = stat.size;
            console.log('ALL: ' + total);
            res.writeHead(200, { 'Content-Length': total, 'Content-Type': 'video/mp4' });
            fs.createReadStream(path).pipe(res);
        }
    }
    catch (err) {
        res.end(err.message);
    }
}).listen(local_port);
console.log('Server running at ' + local_uri);