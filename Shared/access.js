document.addEventListener('DOMContentLoaded', async () => {
  const expected = document.body.dataset.workspaceRole;
  if (!expected || !window.workspace) return;
  try { await window.workspace.ready; window.workspace.requireRole(expected); }
  catch (error) { console.error(error); }
});
