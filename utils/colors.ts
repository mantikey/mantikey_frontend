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
    pending: 'warning',
    executed: 'success',
    rejected: 'error',
    APPROVED: 'success',
    REJECTED: 'error',
    EXECUTED: 'success',
    CANCELLED: 'grey',
    EXPIRED: 'orange',
  };
  return colors[status] || 'grey';
};
