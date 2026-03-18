var fso = new ActiveXObject('Scripting.FileSystemObject');
var file = fso.OpenTextFile('app.js', 1, false, -1); // -1 = Unicode, 0 = ASCII
var scriptText;
try {
    scriptText = file.ReadAll();
} catch(e) {
    file.Close();
    file = fso.OpenTextFile('app.js', 1, false, 0);
    scriptText = file.ReadAll();
}
file.Close();

try {
    new Function(scriptText);
    WScript.Echo('Syntax OK');
} catch(e) {
    WScript.Echo('Syntax Error: ' + e.message);
}
