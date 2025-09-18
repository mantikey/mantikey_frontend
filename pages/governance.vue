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
      <v-btn variant="flat" to="/governance" class="ml-3">Governance</v-btn>
      <v-btn variant="outlined" to="/settings" class="ml-3">Settings</v-btn>

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
      <v-row class="mt-5">
        <v-col cols="12">
          <v-alert
            class="mt-5 mb-5"
            v-if="alertText"
            type="error"
            variant="outlined"
          >
            {{ alertText }}
          </v-alert>

          <!-- ========== CONTRACT OVERVIEW CARD ========== -->
          <v-card>
            <!-- Signers Information -->
            <v-card-text>
              <div
                v-if="signers && signers.length > 0"
                class="d-flex align-center flex-wrap gap-2"
              >
                <div class="d-flex align-center">
                  <v-icon color="primary" size="small" class="me-1"
                    >mdi-account-group</v-icon
                  >
                  <span class="text-body-2 font-weight-medium me-2"
                    >Signers:</span
                  >
                </div>

                <v-chip
                  v-for="signer in signers"
                  :key="signer"
                  color="primary"
                  variant="outlined"
                  @click="viewOnExplorer(signer)"
                  size="small"
                  class="font-mono ml-1 mr-1"
                >
                  {{ truncateAddress(signer) }}
                  <v-tooltip activator="parent" location="top">
                    {{ signer }}
                  </v-tooltip>
                </v-chip>

                <v-divider vertical class="mx-2"></v-divider>

                <div class="d-flex align-center">
                  <v-icon color="success" size="small" class="me-1"
                    >mdi-shield-check</v-icon
                  >
                  <span class="text-body-2">
                    <strong>{{ threshold }}</strong
                    >/<strong>{{ signers.length }}</strong> required
                  </span>
                </div>
              </div>
            </v-card-text>

            <!-- Contract Balances -->
            <v-card-text>
              <div class="d-flex align-center mb-2">
                <v-icon color="primary" size="small" class="me-1"
                  >mdi-safe</v-icon
                >
                <span class="text-body-2 font-weight-medium">Contract</span>

                <v-btn
                  variant="flat"
                  size="normal"
                  class="ml-3 mr-3"
                  @click="viewOnExplorer(contractAddress)"
                >
                  {{ truncateAddress(contractAddress || '') }}</v-btn
                >

                <v-icon color="primary" size="small" class="me-1"
                  >mdi-cash</v-icon
                >
                <span class="text-body-2 font-weight-medium">Balances:</span>
                <v-btn
                  icon="mdi-refresh"
                  variant="text"
                  size="small"
                  :loading="loading"
                  @click="updateBalances"
                ></v-btn>

                <!-- Balance Chips -->
                <v-chip
                  v-if="contractBalanceETH !== undefined"
                  color="blue"
                  variant="outlined"
                  class="balance-chip-compact ml-2"
                >
                  {{ contractBalanceETH.toFixed(6) }} ETH
                </v-chip>

                <v-chip
                  v-if="contractBalanceUSDC !== undefined"
                  color="green"
                  variant="outlined"
                  class="balance-chip-compact ml-2"
                >
                  {{ contractBalanceUSDC.toFixed(2) }} USDC
                </v-chip>

                <v-chip
                  v-if="contractBalanceUSDT !== undefined"
                  color="teal"
                  variant="outlined"
                  class="balance-chip-compact ml-2"
                >
                  {{ contractBalanceUSDT.toFixed(2) }} USDT
                </v-chip>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- ========== TRANSACTIONS SECTION ========== -->
      <v-row class="mt-5">
        <v-col cols="12">
          <!-- ========== GOVERNANCE PROPOSALS SECTION ========== -->
          <v-card class="mt-5">
            <v-card-title>
              <v-icon class="mr-2">mdi-file-document-outline</v-icon>
              Governance Proposals
              <v-spacer></v-spacer>

              <!-- Actions Bar -->
              <div class="d-flex ga-2 align-center">
                <v-btn
                  icon="mdi-refresh"
                  variant="text"
                  size="small"
                  :loading="loadingProposals"
                  @click="loadProposals"
                ></v-btn>

                <v-btn
                  size="small"
                  color="success"
                  variant="outlined"
                  @click="newProposalDialog = true"
                >
                  <v-icon>mdi-plus</v-icon>
                  new proposal
                </v-btn>
              </div>
            </v-card-title>

            <!-- Governance Proposals Data Table -->
            <v-data-table
              :headers="proposalHeaders"
              :items="proposals"
              :items-per-page="10"
              :loading="loadingProposals"
              class="elevation-0"
              loading-text="Loading proposals..."
              no-data-text="No governance proposals found"
            >
              <!-- Custom Column Templates -->
              <template v-slot:item.id="{ item }">
                <v-chip size="small" color="blue" variant="outlined">
                  #{{ item.id }}
                </v-chip>
              </template>

              <template v-slot:item.votes="{ item }">
                <v-chip size="small">
                  <kbd>{{ item.votes }} / {{ threshold }}</kbd>
                </v-chip>
              </template>

              <template v-slot:item.hasVoted="{ item }">
                <v-icon
                  :color="item.hasVoted ? 'green' : 'red'"
                  :icon="item.hasVoted ? 'mdi-check' : 'mdi-close'"
                  size="large"
                />
              </template>

              <template v-slot:item.proposalType="{ item }">
                <v-chip size="small" color="indigo" variant="outlined">
                  {{ item.proposalType }}
                </v-chip>
              </template>

              <template v-slot:item.theSigner="{ item }">
                <div
                  v-if="Number(item.theSigner) !== 0"
                  class="d-flex align-center justify-space-between"
                  style="white-space: nowrap"
                >
                  <code class="text-caption pl-1 pr-1">{{
                    item.theSigner
                  }}</code>
                  <v-btn
                    icon="mdi-content-copy"
                    size="x-small"
                    variant="text"
                    @click="copyToClipboard(item.theSigner)"
                  />
                </div>
              </template>

              <template v-slot:item.newThreshold="{ item }">
                <span
                  v-if="item.newThreshold && Number(item.newThreshold) !== 0"
                  class="pl-1 pr-1 font-weight-bold"
                  >{{ item.newThreshold }}</span
                >
              </template>

              <template v-slot:item.status="{ item }">
                <v-chip size="small" :color="getStatusColor(item.status)">
                  {{ item.status }}
                </v-chip>
              </template>

              <template v-slot:item.createdAt="{ item }">
                <code class="text-caption pl-1 pr-1">
                  {{
                    item.createdAt
                      ? relativeTime(new Date(item.createdAt))
                      : 'N/A'
                  }}
                </code>
              </template>

              <template v-slot:item.deadline="{ item }">
                <code class="text-caption pl-1 pr-1">
                  {{ item.deadline ? relativeTime(item.deadline) : 'N/A' }}
                </code>
              </template>

              <!-- Proposal Actions -->
              <template v-slot:item.action="{ item }">
                <div class="d-flex ga-2" v-if="!item.executed">
                  <v-btn
                    size="small"
                    width="130"
                    color="success"
                    variant="flat"
                    v-if="!item.hasVoted"
                    :disabled="item.status === 'pending'"
                    :loading="executingProposal === item.id"
                    @click="voteProposal(item)"
                  >
                    <v-icon>mdi-thumb-up</v-icon>
                    VOTE
                  </v-btn>

                  <v-btn
                    v-if="item.votes && item.votes >= threshold"
                    size="small"
                    color="orange"
                    width="130"
                    variant="flat"
                    :disabled="item.status === 'pending'"
                    :loading="executingProposal === item.id"
                    @click="executeProposal(item)"
                  >
                    <v-icon>mdi-play</v-icon>
                    Execute
                  </v-btn>
                </div>
              </template>
            </v-data-table>
          </v-card>
        </v-col>
      </v-row>

      <!-- ========== DIALOGS ========== -->

      <!-- New Transaction Dialog -->
      <v-dialog
        v-model="newTransactionDialog"
        max-width="600"
        width="100%"
        scrollable
      >
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-plus-box-outline</v-icon>
            New Transaction
            <v-spacer></v-spacer>
            <v-btn
              icon="mdi-close"
              variant="text"
              aria-label="Close"
              @click="newTransactionDialog = false"
            ></v-btn>
          </v-card-title>

          <v-divider />

          <v-card-text>
            <v-form v-model="formValid" ref="transactionForm">
              <span>Select Token</span>
              <v-row dense>
                <!-- Transaction Type Selection -->
                <v-col>
                  <v-radio-group v-model="newTransaction.transactionType">
                    <v-radio label="ETH" value="ETH" class="ma-1 pa-2" />
                    <v-radio label="USDC" value="USDC" class="ma-1 pa-2" />
                    <v-radio label="USDT" value="USDT" class="ma-1 pa-2" />
                  </v-radio-group>
                </v-col>

                <!-- Recipient Address -->
                <v-col cols="12">
                  <v-text-field
                    v-model="newTransaction.recipient"
                    label="Send To"
                    placeholder="0x..."
                    variant="outlined"
                    autofocus
                  />
                </v-col>

                <!-- Amount -->
                <v-col cols="12">
                  <v-text-field
                    v-model="newTransaction.amount"
                    label="Amount"
                    type="number"
                    step="any"
                    variant="outlined"
                    required
                  />
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              variant="flat"
              size="large"
              :loading="submitting"
              :disabled="!formValid"
              @click="submitTransaction"
            >
              <v-icon class="mr-2">mdi-check</v-icon>
              Submit
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- New Proposal Dialog -->
      <v-dialog v-model="newProposalDialog" max-width="600">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-plus-box-outline</v-icon>
            Create New Proposal
            <v-spacer></v-spacer>
            <v-btn
              icon="mdi-close"
              variant="text"
              @click="newProposalDialog = false"
            ></v-btn>
          </v-card-title>

          <v-card-text>
            <v-form v-model="formValid" ref="proposalForm">
              <p class="text-body-2 mb-4">Proposal Type</p>
              <!-- Proposal Type Selection -->
              <v-select
                v-model="newProposal.proposalType"
                variant="outlined"
                :items="proposalTypeOptions"
                required
              ></v-select>

              <!-- Conditional Fields Based on Proposal Type -->
              <p
                v-if="newProposal.proposalType === 'ADD_SIGNER'"
                class="text-body-2 mb-4"
              >
                New Signer Address
              </p>
              <v-text-field
                v-if="newProposal.proposalType === 'ADD_SIGNER'"
                v-model="newProposal.theSigner"
                variant="outlined"
                required
              ></v-text-field>

              <p
                v-if="newProposal.proposalType === 'REMOVE_SIGNER'"
                class="text-body-2 mb-4"
              >
                Signer Address To Remove
              </p>
              <v-text-field
                v-if="newProposal.proposalType === 'REMOVE_SIGNER'"
                v-model="newProposal.theSigner"
                variant="outlined"
                required
              ></v-text-field>

              <p
                v-if="newProposal.proposalType === 'CHANGE_THRESHOLD'"
                class="text-body-2 mb-4"
              >
                New Threshold
              </p>

              <v-text-field
                v-if="newProposal.proposalType === 'CHANGE_THRESHOLD'"
                v-model="newProposal.newThreshold"
                variant="outlined"
                type="number"
                min="1"
                required
              ></v-text-field>

              <!-- Proposal Type Alerts -->
              <v-alert
                v-if="newProposal.proposalType === 'PAUSE'"
                type="warning"
                variant="tonal"
                class="mt-4"
              >
                This proposal will pause the contract.
              </v-alert>

              <v-alert
                v-if="newProposal.proposalType === 'UNPAUSE'"
                type="success"
                variant="tonal"
                class="mt-4"
              >
                This proposal will unpause the contract.
              </v-alert>
            </v-form>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              variant="flat"
              :loading="submitting"
              :disabled="!formValid"
              @click="handleSubmitProposal"
            >
              <v-icon class="mr-2">mdi-check</v-icon>
              Submit Proposal
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Transaction Hash Display Dialog -->
      <v-dialog v-model="txHashDialog" max-width="600">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            <span>Transaction Details</span>
            <v-btn icon @click="txHashDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>

          <v-divider></v-divider>

          <v-card-text class="pa-4">
            <div class="text-body-2 mb-2">Transaction Hash:</div>
            <div class="d-flex align-center mb-4">
              <v-chip size="small" class="font-mono ml-1 mr-1">{{
                lastTxHash
              }}</v-chip>
            </div>
            <div class="d-flex align-center mb-4">
              <v-btn
                size="small"
                variant="flat"
                @click="copyToClipboard(lastTxHash)"
                >Copy to clipboard</v-btn
              >
            </div>
          </v-card-text>

          <v-divider></v-divider>

          <v-card-actions class="pa-4">
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              @click="viewOnExplorer(lastTxHash)"
              target="_blank"
              rel="noopener noreferrer"
            >
              <v-icon start>mdi-open-in-new</v-icon>
              View on Explorer
            </v-btn>
            <v-btn
              class="ml-2 mr-2"
              color="black"
              variant="outlined"
              @click="txHashDialog = false"
            >
              Close
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

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
import type { Proposal } from '../types/proposal';
import { MANTIKEY_ABI } from '../abi/mantikey_abi';

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
const usdcContract = config.public.usdcContract;
const usdtContract = config.public.usdtContract;
const usdcDecimals = config.public.usdcDecimals;
const usdtDecimals = config.public.usdtDecimals;

// MetaMask wallet integration
const { isConnected, account, connect, disconnect, getBalance, signMessage } =
  useMetaMask();

// ========== UI STATE MANAGEMENT ==========

// Loading states
const walletLoading = ref(true);
const loading = ref(false);
const loadingProposals = ref(false);
const submitting = ref(false);

// Form validation
const formValid = ref(false);
const transactionForm = ref<any>(null);
const proposalForm = ref<any>(null);

// Dialog visibility states
const newTransactionDialog = ref(false);
const newProposalDialog = ref(false);
const txHashDialog = ref(false);

// Transaction execution states
const signingTx = ref<number | null>(null);
const executingTx = ref<number | null>(null);
const executingProposal = ref<number | null>(null);
const pendingStatusCount = ref(0);

// Alert and notification system
const alertText = ref('');
const lastTxHash = ref('');
const snackbar = ref({
  show: false,
  text: '',
  color: 'success',
});

// ========== CONTRACT DATA STATE ==========

// Multisig contract information
const signers = ref<Array<string>>([]);
const threshold = ref<number>(0);

// Balance tracking
const walletBalanceETH = ref<number>(0);
const contractBalanceETH = ref<number>(0);
const contractBalanceUSDC = ref<number>(0);
const contractBalanceUSDT = ref<number>(0);

// ========== GOVERNANCE PROPOSALS ==========

// Proposals data
const proposals = ref<Proposal[]>([]);

// Table headers for governance proposals
const proposalHeaders = [
  { title: 'ID', key: 'id', sortable: true, width: '80px' },
  { title: 'Votes', key: 'votes', sortable: true, width: '110px' },
  { title: 'Voted', key: 'hasVoted', sortable: false, width: '80px' },
  { title: 'Type', key: 'proposalType', sortable: true, width: '120px' },
  { title: 'The Signer', key: 'theSigner', sortable: false, width: '160px' },
  {
    title: 'New Threshold',
    key: 'newThreshold',
    sortable: false,
    width: '150px',
  },
  { title: 'Status', key: 'status', sortable: true, width: '80px' },
  { title: 'Deadline', key: 'deadline', sortable: true, width: '120px' },
  { title: 'Created', key: 'createdAt', sortable: true, width: '120px' },
  { title: 'Action', key: 'action', sortable: true, width: '100px' },
];

// Available proposal types for selection
const proposalTypeOptions = [
  { title: 'Add Signer', value: 'ADD_SIGNER' },
  { title: 'Remove Signer', value: 'REMOVE_SIGNER' },
  { title: 'Change Threshold', value: 'CHANGE_THRESHOLD' },
];

// New proposal form data
const newProposal = ref({
  proposalType: null as string | null,
  theSigner: '0x376d1c280197d6a6b2FBBA5E8D7f77fDEE999E06',
  signature: '',
  payload: '',
  deadline: null as number | null,
  createdAt: null as number | null,
  newThreshold: null as number | null,
});

// ========== UTILITY FUNCTIONS ==========

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

// ========== CONTRACT INTERACTION FUNCTIONS ==========

/**
 * Update contract signers and threshold information
 */
const updateContractData = async () => {
  console.log('Updating contract data...');
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask not found');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(
      contractAddress,
      MANTIKEY_ABI,
      provider
    );

    // Fetch signers and threshold with small delays to avoid rate limiting
    signers.value = await contract.getAllSigners();
    console.log('Contract signers:', signers.value);

    await sleep(500);

    threshold.value = await contract.threshold();
    console.log('Contract threshold:', threshold.value);

    await sleep(500);
  } catch (error) {
    console.error('Error updating contract data:', error);
  }
};

/**
 * Update all token balances for wallet and contract
 */
const updateBalances = async () => {
  console.log('Updating balances...');

  const ERC20_ABI = [
    'function balanceOf(address) view returns (uint256)',
    'function decimals() view returns (uint8)',
  ];

  try {
    if (!window.ethereum) {
      console.error('MetaMask not found');
      return;
    }

    // Update wallet ETH balance
    walletBalanceETH.value = (await getBalance(account.value)) ?? 0;
    console.log('Wallet ETH balance:', walletBalanceETH.value);

    await sleep(500);

    // Show warning if wallet balance is zero
    if (walletBalanceETH.value === 0) {
      alertText.value =
        'Your wallet balance is 0. You cannot interact with the contract';
    }

    // Update contract ETH balance
    contractBalanceETH.value = (await getBalance(contractAddress)) ?? 0;
    console.log('Contract ETH balance:', contractBalanceETH.value);

    // Setup provider for ERC20 token balance queries
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contractUSDC = new ethers.Contract(usdcContract, ERC20_ABI, provider);
    const contractUSDT = new ethers.Contract(usdtContract, ERC20_ABI, provider);

    // Fetch USDC balance
    const balanceUSDCRaw = await contractUSDC.balanceOf(contractAddress);
    contractBalanceUSDC.value = Number(
      ethers.formatUnits(balanceUSDCRaw, Number(usdcDecimals))
    );
    console.log('Contract USDC balance:', contractBalanceUSDC.value);

    await sleep(500);

    // Fetch USDT balance
    const balanceUSDTRaw = await contractUSDT.balanceOf(contractAddress);
    contractBalanceUSDT.value = Number(
      ethers.formatUnits(balanceUSDTRaw, Number(usdtDecimals))
    );
    console.log('Contract USDT balance:', contractBalanceUSDT.value);
  } catch (error) {
    console.error('Error getting token balances:', error);
  }
};

/**
 * Refresh all data - called after wallet connection
 */
const refreshAll = () => {
  console.log('Refreshing all data...');
  alertText.value = '';
  updateContractData();
  updateBalances();
  loadProposals();
};

// ========== GOVERNANCE PROPOSALS FUNCTIONS ==========

/**
 * Load governance proposals from the blockchain
 */
const loadProposals = async () => {
  if (!account.value) {
    console.log('No account connected, cannot load proposals');
    return;
  }

  loadingProposals.value = true;
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask not found');
    }

    updateContractData();

    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(
      contractAddress,
      MANTIKEY_ABI,
      provider
    );

    // Get total proposal count
    let count = 0;
    try {
      count = Number(await contract.proposalCount());
      console.log('Total proposals:', count);
    } catch (e) {
      console.warn('Could not fetch proposal count:', e);
    }

    const proposalList: Proposal[] = [];

    // Load most recent 10 proposals
    const startIndex = Math.max(0, count - 10);

    for (let i = count - 1; i >= startIndex; i--) {
      try {
        const [
          pType,
          target,
          newThreshold,
          votes,
          executed,
          createdAt,
          deadline,
          expired,
        ] = await contract.getProposalInfo(i);

        const hasUserVoted = await contract.hasVoted(i, account.value);

        const proposalTypes = [
          'ADD SIGNER',
          'REMOVE SIGNER',
          'CHANGE THRESHOLD',
        ];

        const proposal = {
          id: i,
          proposalType: proposalTypes[pType] || 'UNKNOWN',
          theSigner: target,
          newThreshold: newThreshold.toString(),
          status: executed ? 'Executed' : expired ? 'Expired' : 'Active',
          createdAt: new Date(Number(createdAt) * 1000),
          hasVoted: hasUserVoted,
          votes: Number(votes),
          deadline: new Date(Number(deadline) * 1000),
          executed: executed,
        };

        proposalList.push(proposal);
      } catch (err) {
        console.error(`Error fetching proposal ${i}:`, err);
      }
    }
    proposals.value = proposalList;
  } catch (err) {
    console.error('Error loading proposals:', err);
    showSnackbar('Failed to load proposals from blockchain', 'error');
  } finally {
    loadingProposals.value = false;
  }
};

/**
 * Submit a new governance proposal
 */
const handleSubmitProposal = async () => {
  if (!proposalForm.value?.validate()) return;

  if (!account.value) {
    showSnackbar('Please connect your wallet first', 'error');
    return;
  }

  submitting.value = true;
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask not found');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, MANTIKEY_ABI, signer);

    let tx;
    const proposalType = newProposal.value.proposalType;

    // Call appropriate contract method based on proposal type
    switch (proposalType) {
      case 'PAUSE':
        tx = await contract.proposePause();
        break;

      case 'UNPAUSE':
        tx = await contract.proposeUnpause();
        break;

      case 'ADD_SIGNER':
        if (!newProposal.value.theSigner) {
          throw new Error('Signer address is required');
        }
        if (!ethers.isAddress(newProposal.value.theSigner)) {
          throw new Error('Invalid signer address format');
        }
        tx = await contract.proposeAddSigner(newProposal.value.theSigner);
        break;

      case 'REMOVE_SIGNER':
        if (!newProposal.value.theSigner) {
          throw new Error('Signer address is required');
        }
        if (!ethers.isAddress(newProposal.value.theSigner)) {
          throw new Error('Invalid signer address format');
        }
        tx = await contract.proposeRemoveSigner(newProposal.value.theSigner);
        break;

      case 'CHANGE_THRESHOLD':
        if (
          !newProposal.value.newThreshold ||
          newProposal.value.newThreshold < 1
        ) {
          throw new Error('New threshold must be at least 1');
        }
        tx = await contract.proposeChangeThreshold(
          newProposal.value.newThreshold
        );
        break;

      default:
        throw new Error('Invalid proposal type');
    }

    showSnackbar('Transaction submitted. Waiting for confirmation...', 'info');
    const receipt = await tx.wait();

    lastTxHash.value = receipt.hash;
    txHashDialog.value = true;

    console.log('Proposal submitted successfully:', {
      txHash: receipt.hash,
      proposalType: proposalType,
      blockNumber: receipt.blockNumber,
    });

    showSnackbar(
      `${proposalType
        .toLowerCase()
        .replace('_', ' ')} proposal created successfully!`,
      'success'
    );

    // Reset form and close dialog
    newProposalDialog.value = false;
    newProposal.value = {
      proposalType: null,
      theSigner: '',
      signature: '',
      createdAt: null,
      payload: '',
      deadline: null,
      newThreshold: null,
    };

    // Reload proposals
    await loadProposals();
  } catch (error: any) {
    console.error('Error submitting proposal:', error);

    let errorMessage = 'Failed to submit proposal';
    if (error.code === 'ACTION_REJECTED') {
      errorMessage = 'Transaction was rejected by user';
    } else if (error.message.includes('Only signers')) {
      errorMessage = 'Only authorized signers can create proposals';
    } else if (error.message.includes('Already a signer')) {
      errorMessage = 'Address is already a signer';
    } else if (error.message.includes('Not a signer')) {
      errorMessage = 'Address is not a current signer';
    } else if (error.message.includes('Threshold')) {
      errorMessage = 'Invalid threshold value';
    } else if (error.reason) {
      errorMessage = error.reason;
    } else if (error.message) {
      errorMessage = error.message;
    }

    showSnackbar(errorMessage, 'error');
  } finally {
    submitting.value = false;
  }
};

/**
 * Vote on a governance proposal
 */
const voteProposal = async (proposal: Proposal) => {
  if (!account.value) {
    showSnackbar('Please connect your wallet first', 'error');
    return;
  }

  executingProposal.value = proposal.id;
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contractABI = ['function vote(uint256 proposalId) external'];
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    showSnackbar('Please check your wallet for confirmation', 'info');
    const tx = await contract.vote(proposal.id);
    const receipt = await tx.wait();

    lastTxHash.value = receipt.hash;
    txHashDialog.value = true;

    showSnackbar(`Proposal #${proposal.id} voted successfully!`, 'success');

    // Reload proposals to reflect new vote
    await loadProposals();
  } catch (error: any) {
    console.error('Error voting on proposal:', error);

    let errorMessage = 'Failed to vote on proposal';
    if (error.code === 'ACTION_REJECTED') {
      errorMessage = 'Transaction was rejected by user';
    } else if (error.message.includes('already')) {
      errorMessage = 'You already voted on this proposal';
    } else if (error.message.includes('expired')) {
      errorMessage = 'This proposal has expired';
    } else if (error.message) {
      errorMessage = error.message;
    }

    showSnackbar(errorMessage, 'error');
  } finally {
    executingProposal.value = null;
  }
};

/**
 * Execute a governance proposal that has enough votes
 */
const executeProposal = async (proposal: Proposal) => {
  if (!account.value) {
    showSnackbar('Please connect your wallet first', 'error');
    return;
  }

  executingProposal.value = proposal.id;
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, MANTIKEY_ABI, signer);

    showSnackbar('Please check your wallet for confirmation', 'info');
    const tx = await contract.executeProposal(proposal.id);
    const receipt = await tx.wait();

    lastTxHash.value = receipt.hash;
    txHashDialog.value = true;

    showSnackbar(`Proposal #${proposal.id} executed successfully!`, 'success');

    // Reload proposals and contract data to reflect changes
    await loadProposals();
    await updateContractData();
  } catch (error: any) {
    console.error('Error executing proposal:', error);

    let errorMessage = 'Failed to execute proposal';
    if (error.code === 'ACTION_REJECTED') {
      errorMessage = 'Transaction was rejected by user';
    } else if (error.message.includes('not enough')) {
      errorMessage = 'Not enough votes to execute proposal';
    } else if (error.message.includes('expired')) {
      errorMessage = 'This proposal has expired';
    } else if (error.message) {
      errorMessage = error.message;
    }

    showSnackbar(errorMessage, 'error');
  } finally {
    executingProposal.value = null;
  }
};

function copyToClipboard(text: string) {
  copy(text);
  showSnackbar('Copied to clipboard', 'success');
}

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
    //currentAccount.value = accounts[0];
    //refreshAll();
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
