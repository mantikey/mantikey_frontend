<template>
  <v-app>
    <v-app-bar flat scroll-behavior="hide">
      <h1 class="text-h4 ma-5">MantiKey</h1>
      <v-spacer></v-spacer>

      <v-menu v-if="isConnected" offset-y>
        <template #activator="{ props }">
          <v-btn v-bind="props" variant="outlined" class="ma-5" color="primary">
            {{ truncateAddress(account || '') }}
          </v-btn>
        </template>

        <v-list>
          <v-list-item @click="viewOnExplorer">
            <v-list-item-title>View on Explorer</v-list-item-title>
          </v-list-item>

          <v-list-item @click="disconnect">
            <v-list-item-title>Disconnect</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-btn
        v-else
        variant="flat"
        color="primary"
        class="ma-5"
        @click="connect"
      >
        <v-icon start>mdi-wallet</v-icon>
        Connect Wallet
      </v-btn>
    </v-app-bar>
    <!-- ========== BODY ========== -->

    <v-container
      v-if="walletLoading"
      class="d-flex align-center justify-center"
      style="height: 70vh"
    >
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </v-container>

    <v-container
      v-if="!isConnected"
      class="d-flex align-center justify-center"
      style="height: 70vh"
    >
      <h2 class="text-h5 font-weight-medium">Please connect your wallet</h2>
    </v-container>

    <v-container v-else fluid class="mt-10 pa-6">
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
                  #{{ item.id }}
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

          <v-card>
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

              <!-- Proposal Type -->
              <template v-slot:item.proposalType="{ item }">
                <v-chip size="small" color="indigo" variant="outlined">
                  {{ item.proposalType }}
                </v-chip>
              </template>

              <!-- Proposer -->
              <template v-slot:item.proposer="{ item }">
                <code class="text-caption">{{ item.proposer }}</code>
              </template>

              <!-- Proposer -->
              <template v-slot:item.theSigner="{ item }">
                <code class="text-caption">{{ item.theSigner }}</code>
              </template>

              <!-- Proposer -->
              <template v-slot:item.newThreshold="{ item }">
                <code class="text-caption">{{ item.newThreshold }}</code>
              </template>

              <!-- Status -->
              <template v-slot:item.status="{ item }">
                <v-chip size="small" :color="getStatusColor(item.status)">
                  {{ item.status }}
                </v-chip>
              </template>

              <!-- Created At -->
              <template v-slot:item.createdAt="{ item }">
                {{ new Date(item.createdAt).toLocaleString() }}
              </template>

              <!-- Actions -->
              <template v-slot:item.action="{ item }">
                <div class="d-flex ga-2">
                  <v-btn
                    size="small"
                    color="success"
                    variant="flat"
                    :disabled="item.status === 'pending'"
                    :loading="executingProposal === item.id"
                    @click="signProposal(item)"
                  >
                    <v-icon>mdi-pen</v-icon>
                    Sign
                  </v-btn>

                  <v-btn
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

      <!-- Transaction Details Dialog -->
      <v-dialog v-model="detailsDialog" max-width="800">
        <v-card v-if="selectedTransaction">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-information-outline</v-icon>
            Transaction Details - #{{ selectedTransaction.id }}
            <v-spacer></v-spacer>
            <v-btn
              icon="mdi-close"
              variant="text"
              @click="detailsDialog = false"
            ></v-btn>
          </v-card-title>

          <v-card-text>
            <v-list density="compact">
              <v-list-item>
                <v-list-item-title>To Address</v-list-item-title>
                <v-list-item-subtitle>
                  <code>{{ selectedTransaction.to }}</code>
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <v-list-item-title>Value</v-list-item-title>
                <v-list-item-subtitle
                  >{{
                    formatEther(selectedTransaction.value)
                  }}
                  ETH</v-list-item-subtitle
                >
              </v-list-item>

              <v-list-item>
                <v-list-item-title>Function</v-list-item-title>
                <v-list-item-subtitle>{{
                  selectedTransaction.functionName || 'transfer'
                }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <v-list-item-title>Status</v-list-item-title>
                <v-list-item-subtitle>
                  <v-chip
                    size="small"
                    :color="getStatusColor(selectedTransaction.status)"
                  >
                    {{ selectedTransaction.status }}
                  </v-chip>
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <v-list-item-title>Signatures</v-list-item-title>
                <v-list-item-subtitle
                  >{{ selectedTransaction.signatures }}/{{
                    selectedTransaction.threshold
                  }}</v-list-item-subtitle
                >
              </v-list-item>

              <v-list-item>
                <v-list-item-title>Transaction Data</v-list-item-title>
                <v-list-item-subtitle>
                  <v-textarea
                    :model-value="selectedTransaction.data"
                    readonly
                    density="compact"
                    rows="4"
                    class="mt-2"
                  ></v-textarea>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="success"
              variant="flat"
              :disabled="
                selectedTransaction.status !== 'pending' ||
                selectedTransaction.signatures >= selectedTransaction.threshold
              "
              :loading="signingTx === selectedTransaction.id"
              @click="signTransaction(selectedTransaction)"
            >
              <v-icon class="mr-2">mdi-pen</v-icon>
              Sign Transaction
            </v-btn>
            <v-btn
              v-if="
                selectedTransaction.signatures >= selectedTransaction.threshold
              "
              color="orange"
              variant="flat"
              :loading="executingTx === selectedTransaction.id"
              @click="executeTransaction(selectedTransaction)"
            >
              <v-icon class="mr-2">mdi-play</v-icon>
              Execute
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

// types
import type { Transaction } from '../types/transaction';
import type { Proposal } from '../types/proposal';

// utils
import { truncateAddress, formatEther } from '../utils/format';
import { getFunctionColor, getStatusColor } from '../utils/colors';

// services
import { fetchProposals, submitProposal } from '../services/api';

// Nuxt runtime config
const config = useRuntimeConfig();
const apiBaseURL = config.public.apiBaseURL;
const explorerURI = config.public.explorerURI;

// metamask composable
const {
  isConnected,
  account,
  balance,
  connect,
  disconnect,
  getBalance,
  signMessage,
} = useMetaMask();

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
  { title: 'Type', key: 'proposalType', sortable: true, width: '140px' },
  { title: 'Proposer', key: 'proposer', sortable: false, width: '200px' },
  { title: 'The Signer', key: 'theSigner', sortable: false, width: '200px' },
  {
    title: 'New Threshold',
    key: 'newThreshold',
    sortable: false,
    width: '200px',
  },
  { title: 'Status', key: 'status', sortable: true, width: '120px' },
  { title: 'Created At', key: 'createdAt', sortable: true, width: '180px' },
  { title: 'Action', key: 'action', sortable: true, width: '100px' },
];

// form/proposal options
const proposalTypes = [
  { title: 'Pause', value: 'PAUSE' },
  { title: 'Unpause', value: 'UNPAUSE' },
  { title: 'Add Signer', value: 'ADD_SIGNER' },
  { title: 'Remove Signer', value: 'REMOVE_SIGNER' },
  { title: 'Change Threshold', value: 'CHANGE_THRESHOLD' },
];

const newProposal = ref({
  proposalType: null as string | null,
  proposer: '',
  theSigner: '',
  signature: '',
  address: '',
  payload: '',
  newThreshold: null as number | null,
});

// state
const submitting = ref(false);
const formValid = ref(false);
const proposalForm = ref<any>(null);
const walletLoading = ref(true);

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

const snackbar = ref({
  show: false,
  text: '',
  color: 'success',
});

// snackbar helper
const showSnackbar = (text: string, color = 'success') => {
  snackbar.value = { show: true, text, color };
};

// explorer link
const viewOnExplorer = () => {
  if (account.value) {
    window.open(`${explorerURI}/address/${account.value}`, '_blank');
  }
};

// load proposals
const loadProposals = async () => {
  loadingProposals.value = true;
  try {
    proposals.value = await fetchProposals(apiBaseURL);
  } catch (err) {
    console.error('Error loading proposals:', err);
    showSnackbar('Failed to load proposals', 'error');
  } finally {
    loadingProposals.value = false;
  }
};

// submit proposal
const handleSubmitProposal = async () => {
  if (!proposalForm.value?.validate()) return;

  if (!account.value) {
    showSnackbar('Please connect your wallet first', 'error');
    return;
  }

  submitting.value = true;
  try {
    console.log('Submitting proposal:', JSON.stringify(newProposal.value));
    console.log('Sending to be signed by:', account.value);

    if (!account.value) {
      throw new Error('Wallet not connected'); // 👈 provider.value is null here
    }

    // Ensure MetaMask is connected
    if (!account.value) {
      try {
        const accounts = await connect(); // triggers MetaMask popup
        if (!accounts || accounts.length === 0) {
          showSnackbar('Wallet not connected', 'error');
          submitting.value = false;
          return;
        }
      } catch (err) {
        showSnackbar('Failed to connect wallet', 'error');
        submitting.value = false;
        return;
      }
    }

    // prepare payload to sign (you can adjust what fields go into the signature)
    const payload = {
      proposalType: newProposal.value.proposalType,
      theSigner: newProposal.value.theSigner,
      newThreshold: newProposal.value.newThreshold,
      targetAddress: newProposal.value.address,
      proposer: account.value,      
      timestamp: Date.now(),
    };

    // stringify for signing
    const message = JSON.stringify(payload);

    // ✍️ Sign the proposal with MetaMask
    const signature = await signMessage(message);

    // send to backend with signature
    const proposalWithSig = {
      ...newProposal.value,
      proposer: account.value,
      payload: message,
      signature,
    };

    await submitProposal(apiBaseURL, proposalWithSig);
    showSnackbar('Proposal submitted successfully!', 'success');
    newProposalDialog.value = false;

    // reset form
    newProposal.value = {
      proposalType: null,
      proposer: '',
      theSigner: '',
      signature: '',
      address: '',
      payload: '',
      newThreshold: null,
    };

    loadProposals();
  } catch (err) {
    console.error('Error submitting proposal:', err);
    showSnackbar('Failed to submit proposal', 'error');
  } finally {
    submitting.value = false;
  }
};

// refresh
const refreshAll = () => {
  console.log('Refreshing data...');
  loadProposals();
};

// transaction actions
const viewTransaction = (transaction: Transaction) => {
  selectedTransaction.value = transaction;
  detailsDialog.value = true;
};

const signProposal = async (transaction: Transaction) => {
  signingTx.value = transaction.id;
  try {
    console.log('Signing transaction:', transaction.id);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    transaction.signatures++;
    showSnackbar(`Transaction #${transaction.id} signed successfully!`);
    if (detailsDialog.value) detailsDialog.value = false;
  } catch (error) {
    console.error('Error signing transaction:', error);
    showSnackbar('Failed to sign transaction', 'error');
  } finally {
    signingTx.value = null;
  }
};

const executeProposal = async (transaction: Transaction) => {
  executingTx.value = transaction.id;
  try {
    console.log('Executing transaction:', transaction.id);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    transaction.status = 'executed';
    showSnackbar(
      `Transaction #${transaction.id} executed successfully!`,
      'success'
    );
    if (detailsDialog.value) detailsDialog.value = false;
  } catch (error) {
    console.error('Error executing transaction:', error);
    showSnackbar('Failed to execute transaction', 'error');
  } finally {
    executingTx.value = null;
  }
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

  if (isConnected.value) {
    loadProposals();
    return;
  }
  console.log('wallet not connected yet');
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
