import { ref, onMounted } from 'vue';
import { MetaMaskSDK, type SDKProvider } from '@metamask/sdk';

const isConnected = ref(false);
const account = ref<string | null>(null);
const balance = ref<number | null>(null);
const provider = ref<SDKProvider | null>(null);

let MMSDK: MetaMaskSDK | null = null;

export function useMetaMask() {
  const init = async () => {
    if (!MMSDK) {
      MMSDK = new MetaMaskSDK({
        dappMetadata: {
          name: 'MantiKey Dapp',
          url: window.location.href,
          iconUrl: 'https://docs.metamask.io/img/metamask-logo.svg',
        },
      });
    }

    // wait for provider to be injected
    provider.value = await waitForProvider();
  };

  const waitForProvider = (): Promise<SDKProvider> => {
    return new Promise((resolve, reject) => {
      const maxTries = 10;
      let tries = 0;

      const checkProvider = () => {
        const p = MMSDK!.getProvider();
        if (p) {
          resolve(p);
        } else {
          tries++;
          if (tries > maxTries) {
            reject(
              new Error('MetaMask provider not found after multiple attempts')
            );
          } else {
            setTimeout(checkProvider, 300); // try again in 300ms
          }
        }
      };

      checkProvider();
    });
  };

  const connect = async () => {
    if (!MMSDK) await init();

    if (!provider.value) {
      await init(); // make extra sure provider is ready
    }

    const accounts = await MMSDK!.connect();
    if (accounts.length > 0) {
      account.value = accounts[0];
      isConnected.value = true;
    }

    return accounts;
  };

  const disconnect = async () => {
    if (MMSDK) {
      await MMSDK.terminate();
    }
    isConnected.value = false;
    account.value = null;
    balance.value = null;
  };

  const getBalance = async () => {
    if (!account.value || !provider.value) return;
    const result = await provider.value.request({
      method: 'eth_getBalance',
      params: [account.value, 'latest'],
    });
    const decimal = BigInt(result as string);
    balance.value = Number(decimal) / 1e18;
  };

  /**
   * Sign a message with MetaMask
   */
  const signMessage = async (message: string) => {
    if (!account.value || !provider.value) {
      throw new Error('Wallet not connected');
    }

    try {
      const signature = await provider.value.request({
        method: 'personal_sign',
        params: [message, account.value],
      });
      return signature as string;
    } catch (err) {
      console.error('Signing failed:', err);
      throw err;
    }
  };

  onMounted(() => {
    init();
  });

  return {
    isConnected,
    account,
    balance,
    connect,
    disconnect,
    getBalance,
    signMessage,
  };
}
