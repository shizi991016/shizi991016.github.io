function $(id) {
    return document.getElementById(id);
}

function $All(className) {
    return document.querySelectorAll(className);
}

let noteId = 0;

// 用于过滤 all, completed 或者 active
let filter = 1;

// 本地存储，用于刷新之后恢复页面
let storage = window.localStorage;

// 记录触摸事件的位移，判断是否为左右滑动
let deltaX = 0;
let deltaY = 0;

window.onload = function() {
    // 从本地存储获取当前 note id
    let noteid = parseInt(storage.getItem('noteId'));
    if (noteid)
        noteId = noteid;

    // 从本地存储添加 note
    addFromStorage();

    // 回车输入
    $('inputText').addEventListener('keyup', function (event) {
        if (event.key !== "Enter")
            return;
        addNote();
    });

    // note 全选
    $('toggleAll').addEventListener('change', toggleAllList);

    // 删除全部已完成
    let clearAllButton = $('clearAll');
    clearAllButton.addEventListener('click', clearCompletedList);
    clearAllButton.classList.add('hidden');

    let filterDiv = $('filterDiv');
    filterDiv.addEventListener('touchstart', function (event) {
        TouchStart(event);
    });
    filterDiv.addEventListener('touchend', function (event) {
        TouchEndFilter(event, clearAllButton);
    });
};

// 将用户输入添加到html
function addNote() {
    let inputText = $('inputText');
    let note = inputText.value;
    // 如果输入为空，直接return
    if (note === '')
        return;

    let listDiv = $('listDiv');
    let noteDiv = document.createElement('div');
    let id = 'note' + noteId++;
    // 将当前 id 存入本地存储，防止恢复之后 id 出现冲突
    storage.setItem('noteId', noteId.toString());
    noteDiv.setAttribute('id', id);
    noteDiv.setAttribute('class', 'noteDiv');
    // 获得闹钟设定时间
    let hour = $('inputHour').value;
    let minute = $('inputMinute').value;
    let time = hour + ':' + minute;
    let timeId = hour + minute;
    // 向html中添加节点
    addHTMLNode(noteDiv, timeId, time, note, id, listDiv);
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
        // 添加class 用于filter查找
        noteDiv.classList.add('completed');
        updateStorage(noteId, "completed", 3);
    }
    else
    {
        noteDiv.classList.remove('completed');
        updateStorage(noteId, "active", 3);
        $('toggleAll').checked = false;
    }
    update();
}

// 删除 note
function removeNote(noteId) {
    let listDiv = $('listDiv');
    let noteDiv = $(noteId);
    listDiv.removeChild(noteDiv);
    storage.removeItem(noteId);
    update();
}

// 按照 filter 更新 html 内容，更新当前 active note 个数
function update() {
    // 用于记录当前活跃note数量
    let count = 0;
    let notes = $All('.noteDiv');
    for (let i = 0; i < notes.length; i++)
    {
        if (!notes[i].classList.contains('completed'))
            count++;
        if (filter === 1
            || (filter === 2 && !notes[i].classList.contains('completed'))
            || (filter === 3 && notes[i].classList.contains('completed')))
            notes[i].classList.remove('hidden');
        else
            notes[i].classList.add('hidden');
    }
    $('count').innerText = count + ' notes left';

    // 设置被选中filter红色高亮
    let allFilter = $('all');
    let activeFilter = $('active');
    let completedFilter = $('completed');
    switch (filter)
    {
        case 1:
            allFilter.classList.add('filterSelected');
            activeFilter.classList.remove('filterSelected');
            completedFilter.classList.remove('filterSelected');
            break;
        case 2:
            allFilter.classList.remove('filterSelected');
            activeFilter.classList.add('filterSelected');
            completedFilter.classList.remove('filterSelected');
            break;
        case 3:
            allFilter.classList.remove('filterSelected');
            activeFilter.classList.remove('filterSelected');
            completedFilter.classList.add('filterSelected');
            break;
        default:
            break;
    }
}

// 清除已完成的 note
function clearCompletedList() {
    let listDiv = $('listDiv');
    let notes = listDiv.querySelectorAll('.noteDiv');
    for (let i = notes.length - 1; i >= 0; --i) {
        let note = notes[i];
        if (note.classList.contains('completed')) {
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
                note.classList.add('completed');
                updateStorage(note.id, "completed", 3);
            }
            else
            {
                note.classList.remove('completed');
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
            addHTMLNode(noteDiv, text[0], text[1], text[2], id, listDiv);
            if (text[3] !== "active")
            {
                noteDiv.classList.add('completed');
                noteDiv.querySelector('.toggle').checked = true;
            }
        }
    }
    update();
}

// 更改 note 内容
function changeNote(noteDiv, label) {
    // 增加class标签，hidden原有展示区域，新增修改区域
    noteDiv.classList.add('editing');

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
        noteDiv.classList.remove('editing');
    }

    edit.addEventListener('blur', function () {
        finish();
    });

    edit.addEventListener('keyup', function (ev) {
        if (ev.key === "Enter")
        {
            label.innerHTML = this.value;
            updateStorage(noteDiv.id, this.value, 2);
            finish();
        }
    });

    // 插入在delete按钮之前
    noteDiv.insertBefore(edit, noteDiv.lastChild);
    edit.focus();
}

// 向 html 中增加节点
function addHTMLNode(noteDiv, timeId, time, note, noteDivId, listDiv) {
    let noteInput = document.createElement('input');
    noteInput.classList.add("toggle");
    noteInput.type = "checkbox";
    let noteLabel = document.createElement('label');
    noteLabel.classList.add("note-time");
    noteLabel.innerText = time;
    let noteP = document.createElement('p');
    noteP.classList.add('note-label');
    noteP.innerText = note;
    let noteButton = document.createElement('button');
    noteButton.classList.add("destroy");
    noteButton.innerText = "Delete";
    noteDiv.append(noteInput);
    noteDiv.append(noteLabel);
    noteDiv.append(noteP);
    noteDiv.append(noteButton);

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
    // 监听note内容上的左右滑动事件
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
        if (listDiv.childNodes[i].querySelector('.note-time').innerText <= time)
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
}

function TouchEnd(event, noteDiv, label) {
    deltaX -= event.changedTouches[0].pageX;
    deltaY -= event.changedTouches[0].pageY;

    if (deltaX > 20)
    {
        noteDiv.classList.add("swap-left");
    }
    else if (deltaX < -20)
    {
        if (noteDiv.classList.contains("swap-left"))
            noteDiv.classList.remove("swap-left");
        else
            changeNote(noteDiv, label);
    }

    deltaX = 0;
    deltaY = 0;
}

function TouchEndFilter(event, clearAllButton) {
    deltaX -= event.changedTouches[0].pageX;

    if (deltaX > 20)
    {
        if (filter >= 2)
        {
            filter -= 1;
            clearAllButton.classList.add('hidden');
            update();
        }
    }
    else if (deltaX < -20)
    {
        if (filter <= 2)
        {
            filter += 1;
            if (filter === 3)
                clearAllButton.classList.remove('hidden');
            update();
        }
    }

    deltaX = 0;
    deltaY = 0;
}