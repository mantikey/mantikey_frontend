<template>
  <v-app>
    <v-app-bar flat scroll-behavior="hide" color="#333">
      <div class="d-flex align-center">
        <v-img
          src="/images/mantikey_logo.png"
          alt="MantiKey Logo"
          height="60"
          width="60"
          contain
          class="ml-5 mt-5 mb-5"
        />
        <span class="text-h5 ml-1 font-weight-bold">MantiKey</span>
      </div>

      <v-menu open-on-hover v-if="isConnected" offset-y>
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            variant="outlined"
            class="mt-5 mb-5 ml-3"
            color="blue lighten-5"
          >
            {{ truncateAddress(contractAddr || '') }}
          </v-btn>
        </template>

        <v-list>
          <v-list-item @click="viewOnExplorer(contractAddr)">
            <v-list-item-title>Open Contract on Explorer</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-spacer></v-spacer>

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
    <!-- ========== BODY ========== -->

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

    <v-container v-else fluid class="mt-10 pa-6">
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
          <v-card>
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
            <v-card-text>
              <div class="d-flex align-center mb-2">
                <v-icon color="primary" size="small" class="me-1"
                  >mdi-safe</v-icon
                >
                <span class="text-body-2 font-weight-medium"
                  >Contract Balances :</span
                ><v-btn
                  icon="mdi-refresh"
                  variant="text"
                  size="small"
                  :loading="loading"
                  @click="updateBalances"
                ></v-btn>

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

      <v-row class="mt-5">
        <v-col cols="12">
          <v-card>
            <v-card-title>
              <v-icon class="mr-2">mdi-wallet-outline</v-icon>
              Pending Transactions
              <v-spacer></v-spacer>
              <div class="d-flex ga-2 align-center">
                <v-btn
                  icon="mdi-refresh"
                  variant="text"
                  size="small"
                  :loading="loading"
                  @click="refreshAll"
                ></v-btn>
                <v-chip color="primary" variant="outlined">
                  {{ pendingTransactions.length }} pending
                </v-chip>
              </div>
            </v-card-title>

            <!--
          * ~~~~~~~~~~ Transactions Proposals Table ~~~~~~~~~~~~
          */-->

            <v-data-table
              :headers="headers"
              :items="pendingTransactions"
              :items-per-page="10"
              :loading="loading"
              class="elevation-0"
              loading-text="Loading transaction requests..."
              no-data-text="No pending transactions"
            >
              <!-- Transaction ID -->
              <template v-slot:item.id="{ item }">
                <v-chip size="small" color="blue" variant="outlined">
                  {{ item.id }}
                </v-chip>
              </template>

              <!-- To Address -->
              <template v-slot:item.to="{ item }">
                <code class="text-caption">{{ truncateAddress(item.to) }}</code>
              </template>

              <!-- Value -->
              <template v-slot:item.value="{ item }">
                <div class="d-flex align-center">
                  <v-icon size="small" class="mr-1">mdi-ethereum</v-icon>
                  {{ formatEther(item.value) }} ETH
                </div>
              </template>

              <!-- Function -->
              <template v-slot:item.functionName="{ item }">
                <v-chip
                  size="small"
                  :color="getFunctionColor(item.functionName)"
                  variant="outlined"
                >
                  {{ item.functionName || 'transfer' }}
                </v-chip>
              </template>

              <!-- Status -->
              <template v-slot:item.status="{ item }">
                <v-chip
                  size="small"
                  :color="getStatusColor(item.status)"
                  variant="flat"
                >
                  {{ item.status }}
                </v-chip>
              </template>

              <!-- Signatures -->
              <template v-slot:item.signatures="{ item }">
                <div class="d-flex align-center">
                  <v-progress-circular
                    :model-value="(item.signatures / item.threshold) * 100"
                    :size="24"
                    :width="3"
                    :color="
                      item.signatures >= item.threshold ? 'success' : 'primary'
                    "
                    class="mr-2"
                  ></v-progress-circular>
                  <span class="text-caption">
                    {{ item.signatures }}/{{ item.threshold }}
                  </span>
                </div>
              </template>

              <!-- Actions -->
              <template v-slot:item.actions="{ item }">
                <div class="d-flex ga-2">
                  <v-btn
                    size="small"
                    color="primary"
                    variant="outlined"
                    @click="viewTransaction(item)"
                    icon="mdi-eye"
                  ></v-btn>

                  <v-btn
                    size="small"
                    color="success"
                    variant="flat"
                    :disabled="
                      item.status !== 'pending' ||
                      item.signatures >= item.threshold
                    "
                    :loading="signingTx === item.id"
                    @click="signTransaction(item)"
                  >
                    <v-icon>mdi-pen</v-icon>
                    Sign
                  </v-btn>

                  <v-btn
                    v-if="item.signatures >= item.threshold"
                    size="small"
                    color="orange"
                    variant="flat"
                    :loading="executingTx === item.id"
                    @click="executeTransaction(item)"
                  >
                    <v-icon>mdi-play</v-icon>
                    Execute
                  </v-btn>
                </div>
              </template>

              <!-- Expandable row for transaction details -->
              <template v-slot:expanded-row="{ item }">
                <tr>
                  <td :colspan="headers.length">
                    <v-card flat class="ma-4">
                      <v-card-title>Transaction Details</v-card-title>
                      <v-card-text>
                        <v-row>
                          <v-col cols="12" md="6">
                            <div class="mb-4">
                              <strong>Transaction Hash:</strong>
                              <code class="ml-2">{{ item.txHash }}</code>
                            </div>
                          </v-col>
                          <v-col cols="12" md="6">
                            <div class="mb-4">
                              <strong>Data:</strong>
                              <v-textarea
                                :model-value="item.data"
                                readonly
                                density="compact"
                                rows="3"
                                class="mt-2"
                              ></v-textarea>
                            </div>
                          </v-col>
                        </v-row>
                      </v-card-text>
                    </v-card>
                  </td>
                </tr>
              </template>
            </v-data-table>
          </v-card>

          <!--
          * ~~~~~~~~~~ Governance Proposals Table ~~~~~~~~~~~~
          */-->

          <v-card class="mt-5">
            <v-card-title>
              <v-icon class="mr-2">mdi-file-document-outline</v-icon>
              Governance Proposals
              <v-spacer></v-spacer>
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

            <v-data-table
              :headers="proposalHeaders"
              :items="proposals"
              :items-per-page="10"
              :loading="loadingProposals"
              class="elevation-0"
              loading-text="Loading proposals..."
              no-data-text="No governance proposals found"
            >
              <!-- Proposal ID -->
              <template v-slot:item.id="{ item }">
                <v-chip size="small" color="blue" variant="outlined">
                  #{{ item.id }}
                </v-chip>
              </template>

              <!-- Votes -->
              <template v-slot:item.votes="{ item }">
                <v-chip size="small">
                  <kbd>{{ item.votes }} / {{ threshold }}</kbd>
                </v-chip>
              </template>

              <!-- hasVoted Type -->
              <template v-slot:item.hasVoted="{ item }">
                <v-icon
                  :color="item.hasVoted ? 'green' : 'red'"
                  :icon="item.hasVoted ? 'mdi-check' : 'mdi-close'"
                  size="large"
                />
              </template>

              <!-- Proposal Type -->
              <template v-slot:item.proposalType="{ item }">
                <v-chip size="small" color="indigo" variant="outlined">
                  {{ item.proposalType }}
                </v-chip>
              </template>

              <!-- Proposer -->
              <template v-slot:item.theSigner="{ item }">
                <code v-if="item.theSigner" class="text-caption">{{
                  item.theSigner
                }}</code>
              </template>

              <!-- Proposer -->
              <template v-slot:item.newThreshold="{ item }">
                <code v-if="item.newThreshold" class="text-caption">{{
                  item.newThreshold
                }}</code>
              </template>

              <!-- Status -->
              <template v-slot:item.status="{ item }">
                <v-chip size="small" :color="getStatusColor(item.status)">
                  {{ item.status }}
                </v-chip>
              </template>

              <!-- Created At -->
              <template v-slot:item.createdAt="{ item }">
                {{
                  item.createdAt
                    ? new Date(item.createdAt).toLocaleString()
                    : 'N/A'
                }}
              </template>

              <!-- Deadline At -->
              <template v-slot:item.deadline="{ item }">
                {{ item.deadline ? timeLeft(item.deadline) : 'N/A' }}
              </template>

              <!-- Actions -->
              <template v-slot:item.action="{ item }">
                <div class="d-flex ga-2" v-if="!item.executed">
                  <v-btn
                    size="small"
                    color="success"
                    variant="flat"
                    v-if="!item.hasVoted"
                    :disabled="item.status === 'pending'"
                    :loading="executingProposal === item.id"
                    @click="voteProposal(item)"
                  >
                    <v-icon>mdi-pen</v-icon>
                    VOTE
                  </v-btn>

                  <v-btn
                    v-if="item.votes >= threshold"
                    size="small"
                    color="orange"
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
              <!-- Proposal Type -->
              <v-select
                v-model="newProposal.proposalType"
                :items="proposalTypes"
                label="Proposal Type"
                required
              ></v-select>

              <!-- Conditional fields -->
              <v-text-field
                v-if="newProposal.proposalType === 'ADD_SIGNER'"
                v-model="newProposal.theSigner"
                label="New Signer Address"
                required
              ></v-text-field>

              <v-text-field
                v-if="newProposal.proposalType === 'REMOVE_SIGNER'"
                v-model="newProposal.theSigner"
                label="Signer Address to Remove"
                required
              ></v-text-field>

              <v-text-field
                v-if="newProposal.proposalType === 'CHANGE_THRESHOLD'"
                v-model="newProposal.newThreshold"
                label="New Threshold"
                type="number"
                min="1"
                required
              ></v-text-field>

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

      <!-- Dialog component -->
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

            <!-- Transaction hash with copy functionality -->
            <div class="d-flex align-center mb-4">
              <v-chip class="ma-2 pa-3">
                {{ lastTxHash }}
              </v-chip>
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

      <!-- Snackbar for notifications -->
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
import { ref, onMounted, watch } from 'vue';
import { useRuntimeConfig } from '#app';
import { useMetaMask } from '../composables/useMetaMask';
import { ethers } from 'ethers';
// types
import type { Transaction } from '../types/transaction';
import type { Proposal } from '../types/proposal';
import { MANTIKEY_ABI } from '../abi/mantikey_abi'; // Add this line

// utils
import { truncateAddress, formatEther, timeLeft } from '../utils/format';
import { getFunctionColor, getStatusColor } from '../utils/colors';

// Nuxt runtime config
const config = useRuntimeConfig();
const contractAddr = config.public.contractAddr;
const explorerURI = config.public.explorerURI;
const usdcContract = config.public.usdcContract;
const usdtContract = config.public.usdtContract;
const usdcDecimals = config.public.usdcDecimals;
const usdtDecimals = config.public.usdtDecimals;

// metamask composable
const { isConnected, account, connect, disconnect, getBalance, signMessage } =
  useMetaMask();

// table headers
const headers = [
  { title: 'ID', key: 'id', sortable: true, width: '80px' },
  { title: 'To', key: 'to', sortable: false, width: '140px' },
  { title: 'Value', key: 'value', sortable: true, width: '120px' },
  { title: 'Function', key: 'functionName', sortable: true, width: '120px' },
  { title: 'Status', key: 'status', sortable: true, width: '100px' },
  { title: 'Signatures', key: 'signatures', sortable: true, width: '100px' },
  { title: 'Actions', key: 'actions', sortable: false, width: '200px' },
];

const proposalHeaders = [
  { title: 'ID', key: 'id', sortable: true, width: '80px' },
  { title: 'Votes', key: 'votes', sortable: true, width: '140px' },
  { title: 'Voted', key: 'hasVoted', sortable: false, width: '120px' },
  { title: 'Type', key: 'proposalType', sortable: true, width: '140px' },
  { title: 'The Signer', key: 'theSigner', sortable: false, width: '200px' },
  {
    title: 'New Threshold',
    key: 'newThreshold',
    sortable: false,
    width: '200px',
  },

  { title: 'Status', key: 'status', sortable: true, width: '120px' },
  { title: 'Deadline', key: 'deadline', sortable: true, width: '180px' },
  { title: 'Created At', key: 'createdAt', sortable: true, width: '180px' },
  { title: 'Action', key: 'action', sortable: true, width: '100px' },
];

// form/proposal options
const proposalTypes = [
  { title: 'Add Signer', value: 'ADD_SIGNER' },
  { title: 'Remove Signer', value: 'REMOVE_SIGNER' },
  { title: 'Change Threshold', value: 'CHANGE_THRESHOLD' },
];

const newProposal = ref({
  proposalType: null as string | null,
  theSigner: '0x376d1c280197d6a6b2FBBA5E8D7f77fDEE999E06',
  signature: '',
  payload: '',
  deadline: null as number | null,
  createdAt: null as number | null,
  newThreshold: null as number | null,
});

// state
const submitting = ref(false);
const formValid = ref(false);
const proposalForm = ref<any>(null);
const walletLoading = ref(true);
const alertText = ref('');

// contract data
const signers = ref<Array<string>>([]); //signers are addresses
const threshold = ref<number>(0);

const walletBalanceETH = ref<number>(0);
const contractBalanceETH = ref<number>(0);
const contractBalanceUSDC = ref<number>(0);
const contractBalanceUSDT = ref<number>(0);

const detailsDialog = ref(false);
const selectedTransaction = ref<Transaction | null>(null);
const signingTx = ref<number | null>(null);
const executingTx = ref<number | null>(null);
const executingProposal = ref<number | null>(null);
const loading = ref(false);

const pendingTransactions = ref<Transaction[]>([]);
const proposals = ref<Proposal[]>([]);
const loadingProposals = ref(false);
const newProposalDialog = ref(false);
const txHashDialog = ref(false);
const lastTxHash = ref('');

const snackbar = ref({
  show: false,
  text: '',
  color: 'success',
});

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// snackbar helper
const showSnackbar = (text: string, color = 'success') => {
  snackbar.value = { show: true, text, color };
};

// explorer link
const viewOnExplorer = (destination) => {
  if (destination.length > 42) {
    window.open(`${explorerURI}/tx/${destination}`, '_blank');
    return;
  }
  window.open(`${explorerURI}/address/${destination}`, '_blank');
};

// Enhanced handleSubmitProposal function for your Vue component
const handleSubmitProposal = async () => {
  if (!proposalForm.value?.validate()) return;

  if (!account.value) {
    showSnackbar('Please connect your wallet first', 'error');
    return;
  }

  submitting.value = true;
  try {
    // Get the provider from MetaMask
    if (!window.ethereum) {
      throw new Error('MetaMask not found');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const contract = new ethers.Contract(contractAddr, MANTIKEY_ABI, signer);

    let tx;
    const proposalType = newProposal.value.proposalType;

    // Call the appropriate contract method based on proposal type
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

        // Validate address format
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

    // Wait for transaction confirmation
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

    // Close dialog and reset form
    newProposalDialog.value = false;
    txHashDialog;
    newProposal.value = {
      proposalType: null,
      theSigner: '',
      signature: '',
      createdAt: null,
      payload: '',
      deadline: null,
      newThreshold: null,
    };
  } catch (error: any) {
    console.error('Error submitting proposal:', error);

    // Handle specific error messages
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

const updateContractData = async () => {
  console.log('Updating contract data...');
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask not found');
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(contractAddr, MANTIKEY_ABI, provider);
    signers.value = await contract.getAllSigners();
    console.log('Contract signers:', signers.value);
    await sleep(500);
    threshold.value = await contract.threshold();
    console.log('Contract threshold:', threshold.value);
    await sleep(500);
  } catch (error) {
    console.error(`Error updating contract data`, error);
  }
};

const updateBalances = async () => {
  console.log('Updating balances...');

  // ERC20 ABI (simplified for balanceOf)
  const ERC20_ABI = [
    'function balanceOf(address) view returns (uint256)',
    'function decimals() view returns (uint8)',
  ];
  try {
    // Get the provider from MetaMask
    if (!window.ethereum) {
      console.error('MetaMask not found');
      return;
    }

    walletBalanceETH.value = (await getBalance(account.value)) ?? 0;
    console.log('wallet ETH balance', walletBalanceETH.value);
    await sleep(500);
    if (walletBalanceETH.value == 0) {
      alertText.value =
        'Your wallet balance is 0. You cannot interract with the contract';
    }

    contractBalanceETH.value = (await getBalance(contractAddr)) ?? 0;
    console.log('contract ETH balance', contractBalanceETH.value);

    const provider = new ethers.BrowserProvider(window.ethereum);
    //const signer = await provider.getSigner();

    const contractUSDC = new ethers.Contract(usdcContract, ERC20_ABI, provider);
    const contractUSDT = new ethers.Contract(usdtContract, ERC20_ABI, provider);

    let balanceUSDCRaw = await contractUSDC.balanceOf(contractAddr);
    contractBalanceUSDC.value = Number(
      ethers.formatUnits(balanceUSDCRaw, Number(usdcDecimals))
    );
    console.log('contract USDC balance', contractBalanceUSDC.value);
    await sleep(500);
    let balanceUSDTRaw = await contractUSDT.balanceOf(contractAddr);
    contractBalanceUSDT.value = Number(
      ethers.formatUnits(balanceUSDTRaw, Number(usdtDecimals))
    );
    console.log('contract USDT balance', contractBalanceUSDT.value);
  } catch (error) {
    console.error(`Error getting token balances`, error);
  }
};

// Enhanced loadProposals function to fetch from blockchain
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

    const provider = new ethers.BrowserProvider(window.ethereum);

    const contract = new ethers.Contract(contractAddr, MANTIKEY_ABI, provider);

    // Get proposal count
    let count = 0;
    try {
      count = Number(await contract.proposalCount());
      console.log('Total proposals:', count);
    } catch (e) {}

    const proposalList: Proposal[] = [];

    // start from the last index and go back up to 10 items
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

        console.log(`proposal info #${i}:`, {
          pType,
          target,
          newThreshold: newThreshold.toString(),
          votes: votes.toString(),
          executed,
          createdAt: createdAt.toString(),
          deadline: deadline.toString(),
          expired,
        });

        const hasUserVoted = await contract.hasVoted(i, account.value);

        const proposalTypes = [
          'ADD SIGNER',
          'REMOVE SIGNER',
          'CHANGE THRESHOLD',
        ];

        // map to your table headers
        const proposal = {
          id: i,
          proposalType: proposalTypes[pType] || 'UNKNOWN',
          theSigner: target,
          newThreshold: newThreshold.toString(),
          status: executed ? 'Executed' : expired ? 'Expired' : 'Active',
          createdAt: new Date(Number(createdAt) * 1000), // assign as Date object
          hasVoted: hasUserVoted,
          votes: Number(votes),
          deadline: new Date(Number(deadline) * 1000), // assign as Date object,
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

// Add execute proposal function
const executeProposal = async (proposal: Proposal) => {
  if (!account.value) {
    showSnackbar('Please connect your wallet first', 'error');
    return;
  }

  executingProposal.value = proposal.id;
  try {
    const { ethers } = await import('ethers');

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddr, MANTIKEY_ABI, signer);

    showSnackbar('Please check your wallet for confirmation', 'info');
    const tx = await contract.executeProposal(proposal.id);
    const receipt = await tx.wait();
    lastTxHash.value = receipt.hash;
    txHashDialog.value = true;

    showSnackbar(`Proposal #${proposal.id} executed successfully!`, 'success');
  } catch (error: any) {
    console.error('Error executing proposal:', error);

    let errorMessage = 'Failed to execute proposal';
    if (error.code === 'ACTION_REJECTED') {
      errorMessage = 'Transaction was rejected by user';
    } else if (error.message.includes('not enough')) {
      errorMessage = 'Not enough votes to execute proposal';
    } else if (error.message.includes('expired')) {
      errorMessage = 'This proposal has expired';
    }

    showSnackbar(errorMessage, 'error');
  } finally {
    executingProposal.value = null;
  }
};

// refresh
const refreshAll = () => {
  console.log('Refreshing data...');
  alertText.value = '';
  updateContractData();
  updateBalances();
  loadProposals();
};

// transaction actions
const viewTransaction = (transaction: Transaction) => {
  selectedTransaction.value = transaction;
  detailsDialog.value = true;
};

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
    const contract = new ethers.Contract(contractAddr, contractABI, signer);

    showSnackbar('Please check your wallet for confirmation', 'info');
    const tx = await contract.vote(proposal.id);
    const receipt = await tx.wait();
    lastTxHash.value = receipt.hash;
    txHashDialog.value = true;
  } catch (error: any) {
    console.error('Error executing proposal:', error);

    let errorMessage = 'Failed to execute proposal';
    if (error.code === 'ACTION_REJECTED') {
      errorMessage = 'Transaction was rejected by user';
    } else if (error.message.includes('not enough')) {
      errorMessage = 'Not enough votes to execute proposal';
    } else if (error.message.includes('expired')) {
      errorMessage = 'This proposal has expired';
    } else if (error.message.includes('already')) {
      errorMessage = 'You already voted this proposal';
    }

    showSnackbar(errorMessage, 'error');
    return;
  }
  showSnackbar(`Proposal #${proposal.id} voted successfully!`, 'success');
  executingProposal.value = null;
};

// lifecycle
onMounted(async () => {
  walletLoading.value = true;
  try {
    await connect(); // will do nothing if already connected
  } catch (err) {
    console.log('No previous wallet connection', err);
  } finally {
    walletLoading.value = false;
  }

  if (!isConnected.value) {
    console.log('wallet not connected yet');
    return;
  }
});

// 🔑 Watch connection state: after connecting, refresh data
watch(isConnected, (connected) => {
  if (connected) {
    console.log('wallet connected');
    refreshAll();
  }
});
</script>

<style scoped>
.v-data-table {
  background: transparent;
}

code {
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 0.875rem;
}
</style>
