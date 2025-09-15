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
    Pending: 'yellow',
    pending: 'yellow',
    Active: 'info',
    rejected: 'error',
    Executed: 'success',
    executed: 'success',
    Canceled: 'grey',
    Expired: 'black',
    expired: 'black',
  };
  return colors[status] || 'grey';
};
