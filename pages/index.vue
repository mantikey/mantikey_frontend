<template>
  <v-app>
    <v-container fluid class="pa-6">
      <v-row>
        <v-col cols="12">
          <h1 class="text-h3 mb-6">MantiKey</h1>

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
                  @click="refreshTransactions"
                ></v-btn>
                <v-chip color="primary" variant="outlined">
                  {{ pendingTransactions.length }} pending
                </v-chip>
              </div>
            </v-card-title>

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
                            <div class="mb-4">
                              <strong>Nonce:</strong>
                              <span class="ml-2">{{ item.nonce }}</span>
                            </div>
                            <div class="mb-4">
                              <strong>Gas Limit:</strong>
                              <span class="ml-2">{{
                                item.gasLimit?.toLocaleString()
                              }}</span>
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
import { ref, onMounted } from 'vue';

// Types
interface Transaction {
  id: number;
  to: string;
  value: bigint;
  data: string;
  functionName?: string;
  nonce: number;
  gasLimit?: number;
  txHash: string;
  signatures: number;
  threshold: number;
  status: 'pending' | 'executed' | 'rejected';
  createdAt: Date;
  signers?: string[];
}

interface ApiTransactionResponse {
  id: number;
  to: string;
  value: string; // comes as string from API
  data: string;
  functionName?: string;
  nonce: number;
  gasLimit?: number;
  txHash: string;
  signatures: number;
  threshold: number;
  status: 'pending' | 'executed' | 'rejected';
  createdAt: string; // ISO string from API
  signers?: string[];
}

// Reactive state
const detailsDialog = ref(false);
const selectedTransaction = ref<Transaction | null>(null);
const signingTx = ref<number | null>(null);
const executingTx = ref<number | null>(null);
const loading = ref(true);
const snackbar = ref({
  show: false,
  text: '',
  color: 'success',
});

const pendingTransactions = ref<Transaction[]>([]);

// Mock API function
const fetchTransactions = async (): Promise<ApiTransactionResponse[]> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Mock API response data
  const mockApiData: ApiTransactionResponse[] = [
    {
      id: 1,
      to: '0x742d35Cc7dF5C0532C38a5a5B5F8D9e4F8e8b9D2',
      value: '1000000000000000000', // 1 ETH in wei
      data: '0xa9059cbb000000000000000000000000742d35cc7df5c0532c38a5a5b5f8d9e4f8e8b9d20000000000000000000000000000000000000000000000000de0b6b3a7640000',
      functionName: 'transfer',
      nonce: 123,
      gasLimit: 21000,
      txHash:
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      signatures: 2,
      threshold: 3,
      status: 'pending',
      createdAt: new Date().toISOString(),
      signers: ['0xSigner1', '0xSigner2'],
    },
    {
      id: 2,
      to: '0x8ba1f109551bD432803012645Hac136c',
      value: '500000000000000000', // 0.5 ETH
      data: '0x',
      nonce: 124,
      gasLimit: 21000,
      txHash:
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      signatures: 1,
      threshold: 3,
      status: 'pending',
      createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    },
    {
      id: 3,
      to: '0x9f8f72aA9304c8B593d555F12eF6589cC3A579A2',
      value: '2000000000000000000', // 2 ETH
      data: '0x17c33503000000000000000000000000742d35cc7df5c0532c38a5a5b5f8d9e4f8e8b9d2',
      functionName: 'proposeAddSigner',
      nonce: 125,
      gasLimit: 50000,
      txHash:
        '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
      signatures: 3,
      threshold: 3,
      status: 'pending',
      createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    },
    {
      id: 4,
      to: '0xA0b86a33E6441e7C6E2650fd5E4E3e2b5A9e0D3C',
      value: '0', // 0 ETH for contract interaction
      data: '0x536db4cb', // pause function
      functionName: 'pause',
      nonce: 126,
      gasLimit: 45000,
      txHash:
        '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
      signatures: 0,
      threshold: 3,
      status: 'pending',
      createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    },
    {
      id: 5,
      to: '0xB1c23d45E6789aBc0123D45e6789AbC0123d45E6',
      value: '750000000000000000', // 0.75 ETH
      data: '0x9c23fa610000000000000000000000000000000000000000000000000000000000000005',
      functionName: 'proposeChangeThreshold',
      nonce: 127,
      gasLimit: 35000,
      txHash:
        '0x5432109876fedcba5432109876fedcba5432109876fedcba5432109876fedcba',
      signatures: 1,
      threshold: 3,
      status: 'pending',
      createdAt: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
    },
  ];

  // Simulate occasional API errors (uncomment to test error handling)
  // if (Math.random() < 0.1) {
  //   throw new Error('Failed to fetch transactions')
  // }

  return mockApiData;
};

// Convert API response to internal format
const transformApiTransaction = (
  apiTx: ApiTransactionResponse
): Transaction => {
  return {
    ...apiTx,
    value: BigInt(apiTx.value),
    createdAt: new Date(apiTx.createdAt),
  };
};

// Load transactions from API
const loadTransactions = async () => {
  loading.value = true;
  try {
    console.log('Fetching transactions from API...');
    const apiTransactions = await fetchTransactions();

    // Transform API data to internal format
    const transactions = apiTransactions.map(transformApiTransaction);

    // Sort by newest first
    transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    pendingTransactions.value = transactions;

    console.log(`Loaded ${transactions.length} transactions`);
    showSnackbar(
      `Loaded ${transactions.length} transaction requests`,
      'success'
    );
  } catch (error) {
    console.error('Error fetching transactions:', error);
    showSnackbar('Failed to load transactions', 'error');
  } finally {
    loading.value = false;
  }
};

// Refresh transactions
const refreshTransactions = () => {
  loadTransactions();
};

// Mount hook
onMounted(() => {
  loadTransactions();
});

// Table headers
const headers = [
  { title: 'ID', key: 'id', sortable: true, width: '80px' },
  { title: 'To', key: 'to', sortable: false, width: '140px' },
  { title: 'Value', key: 'value', sortable: true, width: '120px' },
  { title: 'Function', key: 'functionName', sortable: true, width: '120px' },
  { title: 'Status', key: 'status', sortable: true, width: '100px' },
  { title: 'Signatures', key: 'signatures', sortable: true, width: '100px' },
  { title: 'Actions', key: 'actions', sortable: false, width: '200px' },
];

// Helper functions
const truncateAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const formatEther = (wei: bigint): string => {
  return (Number(wei) / 1e18).toFixed(4);
};

const getFunctionColor = (functionName?: string): string => {
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

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'warning',
    executed: 'success',
    rejected: 'error',
  };
  return colors[status] || 'grey';
};

const showSnackbar = (text: string, color: string = 'success') => {
  snackbar.value = { show: true, text, color };
};

// Actions
const viewTransaction = (transaction: Transaction) => {
  selectedTransaction.value = transaction;
  detailsDialog.value = true;
};

const signTransaction = async (transaction: Transaction) => {
  signingTx.value = transaction.id;

  try {
    // TODO: Replace with actual API call to backend
    console.log('Signing transaction:', transaction.id);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock successful signing
    transaction.signatures++;
    showSnackbar(`Transaction #${transaction.id} signed successfully!`);

    if (detailsDialog.value) {
      detailsDialog.value = false;
    }
  } catch (error) {
    console.error('Error signing transaction:', error);
    showSnackbar('Failed to sign transaction', 'error');
  } finally {
    signingTx.value = null;
  }
};

const executeTransaction = async (transaction: Transaction) => {
  executingTx.value = transaction.id;

  try {
    // TODO: Replace with actual API call to backend
    console.log('Executing transaction:', transaction.id);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock successful execution
    transaction.status = 'executed';
    showSnackbar(
      `Transaction #${transaction.id} executed successfully!`,
      'success'
    );

    if (detailsDialog.value) {
      detailsDialog.value = false;
    }
  } catch (error) {
    console.error('Error executing transaction:', error);
    showSnackbar('Failed to execute transaction', 'error');
  } finally {
    executingTx.value = null;
  }
};

// Sort transactions by newest first
// pendingTransactions.value.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
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
