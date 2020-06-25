function $(id) {
    return document.getElementById(id);
}

function $All(className) {
    return document.querySelectorAll(className);
}

// 静态类命名
const CL_COMPLETED = 'completed';
const CL_EDITING = 'editing';
let noteId = 0;
// 计时器用于判断长按
let timer = null;
// 用于过滤 completed 或者 active
let filter = 1;

let storage = window.localStorage;

let deltaX = 0;
let deltaY = 0;
let deltaTime = 0;

window.onload = function() {
    // 从本地存储获取当前 note id
    let noteid = parseInt(storage.getItem('noteId'));
    if (noteid)
        noteId = noteid;
    // 从本地存储添加 note
    addFromStorage();

    // 回车输入
    $('inputText').addEventListener('keyup', function (event) {
        if (event.keyCode !== 13)
            return;
        addNote();
    });

    // note 全选
    $('toggleAll').addEventListener('change', toggleAllList);

    // 删除全部已完成
    let clearAllButton = $('clearAll');
    clearAllButton.addEventListener('click', clearCompletedList);
    clearAllButton.classList.add('hidden');

    // 过滤 completed / active / all
    $('all').addEventListener('click', function () {
        filter = 1;
        clearAllButton.classList.add('hidden');
        update();
    });
    $('active').addEventListener('click', function () {
        filter = 2;
        clearAllButton.classList.add('hidden');
        update();
    });
    $('completed').addEventListener('click', function () {
        filter = 3;
        clearAllButton.classList.remove('hidden');
        update();
    });
};

// 将用户输入添加到html
function addNote() {
    let inputText = $('inputText');
    let note = inputText.value;
    if (note === '')
        return;

    let listDiv = $('listDiv');
    let noteDiv = document.createElement('div');
    let id = 'note' + noteId++;
    // 将当前 id 存入本地存储，防止恢复之后 id 出现冲突
    storage.setItem('noteId', noteId.toString());
    noteDiv.setAttribute('id', id);
    noteDiv.setAttribute('class', 'noteDiv');
    let hour = $('inputHour').value;
    let minute = $('inputMinute').value;
    let time = hour + ':' + minute;
    let timeId = hour + minute;
    // 向html中添加节点
    addTHMLNode(noteDiv, timeId, time, note, id, listDiv);
    let message = timeId + ";" + time + ";" + note + ";" + "active";
    // 将 note 存入本地存储
    storage.setItem(id, message);
    inputText.value = '';
    update();
}

// 更新 note 状态， completed / active
function updateNote(noteId, completed) {
    let noteDiv = $(noteId);
    if (completed)
    {
        noteDiv.classList.add(CL_COMPLETED);
        updateStorage(noteId, "completed", 3);
    }
    else
    {
        noteDiv.classList.remove(CL_COMPLETED);
        updateStorage(noteId, "active", 3);
    }
    $('toggleAll').checked = false;
    update();
}

// 删除 note
function removeNote(noteId) {
    let listDiv = $('listDiv');
    let noteDiv = $(noteId);
    listDiv.removeChild(noteDiv);
    storage.removeItem(noteId);
    $('toggleAll').checked = false;
    update();
}

// 按照 filter 更新 html 内容，更新当前 active note 个数
function update() {
    let count = 0;
    let notes = $All('.noteDiv');
    for (let i = 0; i < notes.length; i++)
    {
        if (!notes[i].classList.contains(CL_COMPLETED))
            count++;
        if (filter === 1
            || (filter === 2 && !notes[i].classList.contains(CL_COMPLETED))
            || (filter === 3 && notes[i].classList.contains(CL_COMPLETED)))
            notes[i].classList.remove('hidden');
        else
            notes[i].classList.add('hidden');
    }
    $('count').innerText = count + ' notes left';
}

// 清除已完成的 note
function clearCompletedList() {
    let listDiv = $('listDiv');
    let notes = listDiv.querySelectorAll('.noteDiv');
    for (let i = notes.length - 1; i >= 0; --i) {
        let note = notes[i];
        if (note.classList.contains(CL_COMPLETED)) {
            listDiv.removeChild(note);
            storage.removeItem(note.id);
        }
    }
    $('toggleAll').checked = false;
    update();
}

// 全选
function toggleAllList() {
    let notes = $All('.noteDiv');
    let toggleAll = $('toggleAll');
    let checked = toggleAll.checked;
    for (let i = 0; i < notes.length; ++i) {
        let note = notes[i];
        let toggle = note.querySelector('.toggle');
        if (toggle.checked !== checked) {
            toggle.checked = checked;
            if (checked)
            {
                note.classList.add(CL_COMPLETED);
                updateStorage(note.id, "completed", 3);
            }
            else
            {
                note.classList.remove(CL_COMPLETED);
                updateStorage(note.id, "active", 3);
            }
        }
    }
    update();
}

// 更新存储信息
// index=2 表示更新 note 内容
// index=3 表示更新 note 状态
function updateStorage(noteId, str, index)
{
    let stores = storage.getItem(noteId).split(";");
    stores[index] = str;
    let message = stores.join(";");
    storage.setItem(noteId, message);
}

// 从本地存储增加 note
function addFromStorage() {
    let listDiv = $('listDiv');
    for (let i = 0; i < noteId; i++)
    {
        let id = 'note' + i;
        let message = storage.getItem(id);
        if (message !== null)
        {
            let text = message.split(";");
            let noteDiv = document.createElement('div');
            noteDiv.setAttribute('id', id);
            noteDiv.setAttribute('class', 'noteDiv');
            addTHMLNode(noteDiv, text[0], text[1], text[2], id, listDiv);
            if (text[3] !== "active")
            {
                noteDiv.classList.add(CL_COMPLETED);
                noteDiv.querySelector('.toggle').checked = true;
            }
        }
    }
    update();
}

// 更改 note 内容
function changeNote(noteDiv, label) {
    timer = setTimeout(function () {
        noteDiv.classList.add(CL_EDITING);

        let edit = document.createElement('input');
        let finished = false;
        edit.setAttribute('type', 'text');
        edit.setAttribute('class', 'edit');
        edit.setAttribute('value', label.innerText);

        function finish() {
            if (finished)
                return;
            finished = true;
            noteDiv.removeChild(edit);
            noteDiv.classList.remove(CL_EDITING);
        }

        edit.addEventListener('blur', function () {
            finish();
        });

        edit.addEventListener('keyup', function (ev) {
            if (ev.keyCode === 13)
            {
                label.innerHTML = this.value;
                updateStorage(noteDiv.id, this.value, 2);
                finish();
            }
        });

        noteDiv.insertBefore(edit, noteDiv.lastChild);
        edit.focus();
    }, 2000)
}

// 向 html 中增加节点
function addTHMLNode(noteDiv, timeId, time, note, noteDivId, listDiv) {
    noteDiv.innerHTML = [
        '<input class="toggle" type="checkbox">',
        '<label class="note-time" id="' + timeId + '">' + time + '</label>',
        '<p class="note-label">' + note + '</p>',
        '<button class="destroy">Delete</button>'
    ].join('');

    // 设置铃声延迟
    let clock = dealDate(time);
    if (clock !== null)
    {
        setTimeout(function () {
            let audio = $('audio');
            audio.muted = false;
            audio.play();
        }, clock);
    }


    let label = noteDiv.querySelector('.note-label');
    // label.addEventListener('touchstart', function () {
    //     changeNote(noteDiv, label);
    // });
    //
    // label.addEventListener('touchend', function () {
    //     clearTimeout(timer);
    // });
    label.addEventListener('touchstart', function (event) {
        TouchStart(event);
    });

    label.addEventListener('touchend', function (event) {
        TouchEnd(event, noteDiv, label);
    });

    noteDiv.querySelector('.toggle').addEventListener('change', function() {
        updateNote(noteDivId, this.checked);
    });

    noteDiv.querySelector('.destroy').addEventListener('click', function() {
        removeNote(noteDivId);
    });

    let listChild = listDiv.firstChild;
    for (let i = 0; i < listDiv.childNodes.length; i++)
    {
        if (listDiv.childNodes[i].querySelector('.note-time').id <= timeId)
        {
            listChild = listDiv.childNodes[i];
        }
        else
        {
            listChild = listDiv.childNodes[i];
            break;
        }
    }
    listDiv.insertBefore(noteDiv, listChild);
}

// 获取当前 Date ，计算当前时间与设置时间之间的差距
function dealDate(dateString) {
    let now = new Date();
    let nowHour = now.getHours();
    let nowMinute = now.getMinutes();
    dateString = dateString.split(":");
    let forHour = parseInt(dateString[0]);
    let forMinute = parseInt(dateString[1]);
    let hour = forHour - nowHour;
    let minute = forMinute - nowMinute;
    if (hour < 0 || (hour === 0 && minute <= 0))
        return null;
    else
        return hour * 60 * 60 * 1000 + minute * 60 * 1000;
}

function TouchStart(event) {
    deltaX = event.touches[0].pageX;
    deltaY = event.touches[0].pageY;
    deltaTime = new Date().getTime();
}

function TouchEnd(event, noteDiv, label) {
    let timeGap = new Date().getTime() - deltaTime;
    deltaX -= event.changedTouches[0].pageX;
    deltaY -= event.changedTouches[0].pageY;

    if (timeGap >= 1000)
    {
        changeNote(noteDiv, label);
        console.log("change");
    }
    else
    {
        if (deltaX > 10 && Math.abs(deltaY) < 5)
        {
            noteDiv.classList.add("swap-left");
        }
        else if (deltaX < -10 && Math.abs(deltaY) < 5)
            noteDiv.classList.remove("swap-left");
    }

    deltaX = 0;
    deltaY = 0;
    deltaTime = 0;
}