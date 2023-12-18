export default {
  admin: 'Run VS Code with admin privileges so the changes can be applied.',
  enabled:
    'Concise syntax enabled. Restart to take effect. ' +
    "If Code complains about it is corrupted, CLICK DON'T SHOW AGAIN. " +
    'See README for more detail.',
  disabled:
    'Concise syntax disabled and reverted to default. Restart to take effect.',
  already_disabled: 'Concise syntax already disabled.',
  somethingWrong: 'Something went wrong: ',
  internalError: 'Internal error: ',
  restartIde: 'Restart Visual Studio Code',
  notfound: 'Concise syntax not found.',
  notConfigured: 'Concise syntax path not configured.',
  reloadAfterVersionUpgrade:
    'Detected reloading Concise syntax after VSCode is upgraded. ' +
    'Performing application only.',
  cannotLoad: (url: string) => `Cannot load '${url}'. Skipping.` as const,
} as const
