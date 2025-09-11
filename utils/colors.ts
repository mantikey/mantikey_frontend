export const getFunctionColor = (functionName?: string): string => {
  const colors: Record<string, string> = {
    transfer: 'blue',
    proposeAddSigner: 'green',
    proposeRemoveSigner: 'red',
    proposeChangeThreshold: 'orange',
    pause: 'red',
    unpause: 'green',
    execute: 'purple',
  };
  return colors[functionName || 'transfer'] || 'grey';
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    Pending: 'warning',
    Active: 'info',
    rejected: 'error',
    Executed: 'success',
    Canceled: 'grey',
    Expired: 'orange',
  };
  return colors[status] || 'grey';
};
