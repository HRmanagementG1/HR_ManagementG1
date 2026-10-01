(() => {
  const database = new Promise((resolve,reject) => {
    const request = indexedDB.open('workforce-files',1);
    request.onupgradeneeded = () => request.result.createObjectStore('files',{keyPath:'id'});
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('File storage is unavailable in this browser.'));
  });
  database.catch(() => {});
  window.taskFiles = {
    async save(files, taskId) {
      if (files.some(file => file.size > 20 * 1024 * 1024)) throw new Error('Choose files smaller than 20 MB each.');
      const db = await database;
      const entries = files.map(file => ({id:crypto.randomUUID(),taskId:String(taskId),name:file.name,type:file.type,size:file.size,blob:file}));
      await new Promise((resolve,reject) => {
        const tx = db.transaction('files','readwrite');
        entries.forEach(entry => tx.objectStore('files').put(entry));
        tx.oncomplete = resolve; tx.onerror = () => reject(new Error('Files could not be saved. Check browser storage space.')); tx.onabort = tx.onerror;
      });
      return entries.map(({blob,...metadata}) => metadata);
    },
    async download(id) {
      const db = await database;
      const entry = await new Promise((resolve,reject) => {
        const request = db.transaction('files').objectStore('files').get(id);
        request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
      });
      const W = window.workspace, task = W.tasks().find(t => String(t.id) === entry?.taskId), user = W.session();
      if (!entry || !task || !user || (user.role !== 'HR' && (String(task.employeeId) !== String(user.id) || task.visibleToEmployee === false))) throw new Error('This file is not available for your account.');
      const url = URL.createObjectURL(entry.blob), link = document.createElement('a');
      link.href = url; link.download = entry.name; document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url),1000);
    },
    render(container, attachments = []) {
      if (!container) return;
      container.replaceChildren();
      attachments.forEach(file => {
        const button = document.createElement('button'); button.type = 'button';
        button.textContent = `↓ ${file.name} · ${Math.max(1,Math.round(file.size / 1024))} KB`;
        button.onclick = async () => { try { await this.download(file.id); } catch (error) { const message = document.createElement('p'); message.textContent = error.message; message.setAttribute('role','alert'); container.append(message); } };
        container.append(button);
      });
    }
  };
})();
