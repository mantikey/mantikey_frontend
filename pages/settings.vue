<template>
  <v-app>
    <!-- ========== NAVIGATION BAR ========== -->
    <v-app-bar flat scroll-behavior="hide" color="#333">
      <!-- Logo and Brand -->
      <div class="d-flex align-center">
        <v-img
          src="/images/mantikey_logo.png"
          alt="MantiKey Logo"
          height="60"
          width="60"
          contain
          class="ml-5 mt-5 mb-5"
        />
        <span class="ml-2 text-h5 font-weight-bold"> MantiKEY </span>
      </div>

      <v-spacer></v-spacer>

      <v-btn variant="outlined" to="/" class="ml-3">Home</v-btn>
      <v-btn variant="outlined" to="/governance" class="ml-3">Governance</v-btn>
      <v-btn variant="flat" to="/settings" class="ml-3">Settings</v-btn>

      <!-- Wallet Connection Area -->
      <v-menu open-on-hover v-if="isConnected" offset-y>
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            variant="outlined"
            class="mt-5 mb-5 ml-3"
            color="blue lighten-5"
          >
            {{ truncateAddress(account || '') }}
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="viewOnExplorer(account)">
            <v-list-item-title>Open Wallet on Explorer</v-list-item-title>
          </v-list-item>
          <v-list-item @click="disconnect">
            <v-list-item-title>Disconnect</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-btn
        v-else
        variant="flat"
        color="blue lighten-5"
        class="ma-5"
        @click="connect"
      >
        <v-icon start>mdi-wallet</v-icon>
        Connect Wallet
      </v-btn>
    </v-app-bar>

    <!-- ========== MAIN CONTENT ========== -->

    <!-- Wallet Connection Prompt -->
    <v-container
      v-if="!isConnected || walletLoading"
      class="d-flex align-center justify-center"
      style="height: 70vh"
    >
      <h2 class="text-h5 font-weight-medium">Please connect your wallet</h2>
      <v-progress-circular
        class="ma-5"
        indeterminate
        color="primary"
      ></v-progress-circular>
    </v-container>

    <!-- Main Dashboard -->
    <v-container v-else fluid class="mt-10 pa-6">
      <!-- Error Alert -->

      <v-alert
        class="mt-5 mb-5"
        v-if="alertText"
        type="error"
        variant="outlined"
      >
        {{ alertText }}
      </v-alert>

      <v-row class="mt-5">
        <v-container fluid class="d-flex">
          <v-card class="pa-4" max-width="1200" width="100%">
            <v-row class="align-center" dense>
              <v-col cols="12">
                <v-card class="pa-4" elevation="0">
                  <v-card-text class="text-h6 pa-0">
                    <v-icon icon="mdi-label" class="me-2 text-primary"></v-icon>
                    Address Book
                  </v-card-text>

                  <v-row dense>
                    <v-col cols="12" sm="2">
                      <v-text-field
                        v-model="newLabel"
                        label="Label"
                        variant="outlined"
                        prepend-inner-icon="mdi-tag"
                        color="primary"
                        clearable
                      />
                    </v-col>

                    <v-col cols="12" sm="6">
                      <v-text-field
                        v-model="newAddress"
                        label="Address"
                        variant="outlined"
                        prepend-inner-icon="mdi-map-marker"
                        color="primary"
                        clearable
                      />
                    </v-col>

                    <v-col cols="12" sm="4">
                      <v-btn color="primary" height="60" @click="addAddress"
                        >ADD ADDRESS
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-card>
              </v-col>
            </v-row>

            <!-- Address Book Table -->

            <v-table v-if="addressBook.length > 0" density="compact">
              <tbody>
                <tr v-for="(entry, index) in addressBook" :key="index">
                  <td>{{ entry.label }}</td>
                  <td class="text-truncate">{{ entry.address }}</td>
                  <td class="text-center">
                    <v-icon
                      size="small"
                      class="me-2"
                      @click="editAddress(index)"
                    >
                      mdi-pencil
                    </v-icon>
                    <v-icon size="small" @click="deleteAddress(index)">
                      mdi-delete
                    </v-icon>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card>
        </v-container>
      </v-row>

      <!-- Notification Snackbar -->
      <v-snackbar
        v-model="snackbar.show"
        :color="snackbar.color"
        :timeout="3000"
      >
        {{ snackbar.text }}
        <template v-slot:actions>
          <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
        </template>
      </v-snackbar>
    </v-container>
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, unref, nextTick } from 'vue';
import { useClipboard } from '@vueuse/core';
import { useRuntimeConfig, useFetch } from '#app';
import { useMetaMask } from '../composables/useMetaMask';
import { Transaction } from '../types/transaction';
import { ethers, parseEther } from 'ethers';

// Utils
import { truncateAddress, formatEther, relativeTime } from '../utils/format';
import { getStatusColor } from '../utils/colors';
const { copy } = useClipboard();

// ========== CONFIGURATION & SETUP ==========

// Runtime configuration from Nuxt
const config = useRuntimeConfig();
const backendURI = config.public.backendURI;
const contractAddress = config.public.contractAddress;
const explorerURI = config.public.explorerURI;
const chainID = config.public.chainID;

type Entry = { label: string; address: string };

const newLabel = ref('');
const newAddress = ref('');
const addressBook = ref<Entry[]>([]);

let sessionSignature: string | null = null;

// MetaMask wallet integration
const { isConnected, account, connect, disconnect, getBalance, signMessage } =
  useMetaMask();

// ========== UI STATE MANAGEMENT ==========

// Loading states
const walletLoading = ref(true);

// Alert and notification system
const alertText = ref('');
const snackbar = ref({
  show: false,
  text: '',
  color: 'success',
});
// ========== UTILITY FUNCTIONS ==========

async function addAddress() {
  if (!newLabel.value.trim() || !newAddress.value.trim()) return;

  try {
    let body: Record<string, any> = {
      owner: account.value,
      label: newLabel.value.trim(),
      address: newAddress.value.trim(),
    };
    // Submit to backend
    const { error } = await useFetch(`${backendURI}/label`, {
      method: 'POST',
      body,
    });

    if (error.value) {
      console.log('error');
      console.error(
        'Failed to save label. Please check backend logs',
        error.value
      );
      if (error.value.data.error) {
        showSnackbar(error.value.data.error, 'error');
      } else {
        showSnackbar(
          'Failed to save label. Please check backend logs',
          'error'
        );
      }
    } else {
      console.log('Label saved successfully');
      showSnackbar('Label saved successfully', 'success');

      //retrive labels
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    showSnackbar('Failed to save label', 'error');
  }

  newLabel.value = '';
  newAddress.value = '';
}

function editAddress(index: number) {
  const entry = addressBook.value[index];
  newLabel.value = entry.label;
  newAddress.value = entry.address;
  console.log('editing', entry);
}

async function deleteAddress(index: number) {
  const entry = addressBook.value[index];
  console.log('Deleting', entry);
}

/**
 * Simple sleep utility for adding delays
 */
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Display a snackbar notification to the user
 */
const showSnackbar = (text: string, color = 'success') => {
  snackbar.value = { show: true, text, color };
};

/**
 * Open blockchain explorer for given address or transaction hash
 */
const viewOnExplorer = (destination: string) => {
  if (destination.length > 42) {
    // Transaction hash
    window.open(`${explorerURI}/tx/${destination}`, '_blank');
    return;
  }
  // Address
  window.open(`${explorerURI}/address/${destination}`, '_blank');
};

/**
 * Refresh all data - called after wallet connection
 */
const refreshAll = () => {
  console.log('Refreshing all data...');
  alertText.value = '';
};

function copyToClipboard(text: string) {
  copy(text);
  showSnackbar('Copied to clipboard', 'success');
}

const getLabels = async () => {
  try {
    let { data, error } = await useFetch(`${backendURI}/labels`, {
      method: 'GET',
      params: { owner: account.value },
    });

    if (error.value) {
      console.error('Failed to fetch labels. Please check backend logs');
      if (error.value.data.error) {
        showSnackbar(error.value.data.error, 'error');
      } else {
        showSnackbar(
          'Failed to fetch labels. Please check backend logs',
          'error'
        );
      }
      return;
    }
    addressBook.value = data.value?.data || [];
    console.log('Labels fetched successfully', addressBook.value);
  } catch (err) {
    console.error('Unexpected error:', err);
    showSnackbar('Failed to fetch labels', 'error');
  }
};

// ========== LIFECYCLE HOOKS ==========

/**
 * Component initialization - attempt wallet connection
 */
onMounted(async () => {
  walletLoading.value = true;
  try {
    await connect(); // Will do nothing if already connected
  } catch (err) {
    console.log('No previous wallet connection found:', err);
  } finally {
    walletLoading.value = false;
  }

  if (!isConnected.value) {
    console.log('Wallet not connected yet');
    return;
  }

  // Check initial connection state
  window.ethereum
    .request({ method: 'eth_accounts' })
    .then((accounts: string[]) => {
      handleAccountsChanged(accounts);
    });

  window.ethereum.request({ method: 'eth_chainId' }).then((chainId: string) => {
    handleChainChanged(chainId);
  });

  // Listen for account changes
  window.ethereum.on('accountsChanged', handleAccountsChanged);

  // Listen for chain/network changes
  window.ethereum.on('chainChanged', handleChainChanged);

  //retrive labels (GET on /labels with owner as queery parametr)
  await getLabels();
});

/**
 * Clean up listeners on unmount
 */
onUnmounted(() => {
  if (typeof window.ethereum !== 'undefined') {
    const ethereum = window.ethereum;
    ethereum.removeListener('accountsChanged', handleAccountsChanged);
    ethereum.removeListener('chainChanged', handleChainChanged);
  }
});

// ========== EVENT HANDLERS ========

/**
 * Handle account changes
 */
function handleAccountsChanged(accounts: string[]) {
  if (accounts.length === 0) {
    console.log('MetaMask is locked or no accounts are connected');
    isConnected.value = false;
    //currentAccount.value = null;
  } else {
    console.log('Account changed:', accounts[0]);
    isConnected.value = true;
    account.value = accounts[0];
    refreshAll();
  }
}

/**
 * Handle chain changes
 */
function handleChainChanged(chainId: string) {
  if (BigInt(chainId) !== BigInt(chainID)) {
    alertText.value = `Please switch to the correct blockchain network (Expected Chain ID: ${chainID})`;
  } else {
    alertText.value = '';
  }
}

// ========== WATCHERS ==========

/**
 * Watch for wallet connection changes and refresh data when connected
 */
watch(isConnected, (connected) => {
  if (connected) {
    console.log('Wallet connected - refreshing data');
    refreshAll();
  }
});
</script>
