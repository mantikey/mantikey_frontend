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
            {{ truncateAddress(contractAddress || '') }}
          </v-btn>
        </template>

        <v-list>
          <v-list-item @click="viewOnExplorer(contractAddress)">
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
              <v-progress-circular
                class="ma-3"
                color="primary"
                v-if="loadingPending"
                indeterminate
              ></v-progress-circular>

              <v-spacer></v-spacer>
              <div class="d-flex ga-2 align-center">
                <v-btn
                  icon="mdi-refresh"
                  variant="text"
                  size="small"
                  :loading="loading"
                  @click="getPendingTxesFromAPI"
                ></v-btn>

                <v-btn
                  size="small"
                  color="success"
                  variant="flat"
                  @click="newTransactionDialog = true"
                >
                  <v-icon>mdi-plus</v-icon>
                  new transaction
                </v-btn>
                <v-chip color="primary" variant="outlined">
                  {{ pendingTxTotalItems }} pending
                </v-chip>
              </div>
            </v-card-title>

            <!--
          * ~~~~~~~~~~ Pending Transactions Table ~~~~~~~~~~~~
          */-->

            <v-data-table
              v-model:options="pendingTxOptions"
              :headers="pendingTxHeaders"
              :items="pendingTransactions"
              :items-length="pendingTxTotalItems"
              :loading="loading"
              density="compact"
              class="elevation-0"
              loading-text="Loading transaction requests..."
              no-data-text="No pending transactions"
              item-value="id"
            >
              <!-- Transaction ID -->
              <template v-slot:item.id="{ item }">
                <v-chip size="small" color="blue" variant="outlined">
                  {{ item.id }}
                </v-chip>
              </template>

              <!-- Transaction Type -->
              <template v-slot:item.txType="{ item }">
                <template v-if="item.txType === 'eth'">
                  <v-icon size="small">mdi-ethereum</v-icon>
                  ETH
                </template>
                <template v-else-if="item.txType === 'erc20'">
                  <v-chip
                    v-if="
                      item.erc20Contract?.toLowerCase() ===
                      usdcContract.toLowerCase()
                    "
                    >USDC</v-chip
                  >
                  <v-chip
                    v-else-if="
                      item.erc20Contract?.toLowerCase() ===
                      usdtContract.toLowerCase()
                    "
                  >
                    USDT</v-chip
                  >
                  <v-chip v-else> ERC20 </v-chip>
                </template>
              </template>
              <!-- To Address -->
              <template v-slot:item.toAddress="{ item }">
                <code class="text-caption pl-1 pr-1">{{ item.toAddress }}</code>
              </template>

              <!-- To Address -->
              <template v-slot:item.createdAt="{ item }">
                <code class="text-caption pl-1 pr-1">{{
                  relativeTime(item.createdAt)
                }}</code>
              </template>

              <!-- Value -->
              <template v-slot:item.value="{ item }">
                <div class="d-flex align-center">
                  <!-- ETH -->
                  <template v-if="item.txType === 'eth'">
                    {{
                      formatEther(item.value)
                        .toString()
                        .replace(/(\.\d*?[1-9])0+$/, '$1')
                    }}
                    ETH
                  </template>

                  <!-- ERC20 -->
                  <template
                    v-else-if="
                      item.txType === 'erc20' &&
                      item.erc20Amount &&
                      item.erc20Decimals != null
                    "
                  >
                    {{ item.erc20Amount }}
                    <span class="ml-1">{{ item.erc20Symbol }}</span>
                  </template>

                  <!-- Fallback -->
                  <template v-else>-</template>
                </div>
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

              <!-- Signatures (stubbed) -->
              <template v-slot:item.signatureCount="{ item }">
                <div class="d-flex align-center">
                  <v-tooltip
                    :text="`Signatures ${item.signatureCount} of ${threshold} required`"
                  >
                    <template #activator="{ props }">
                      <v-progress-circular
                        v-bind="props"
                        :model-value="
                          (Number(item.signatureCount) /
                            (Number(threshold) || 1)) *
                          100
                        "
                        :size="24"
                        :width="3"
                        :color="
                          Number(item.signatureCount) >= Number(threshold)
                            ? 'success' // green
                            : Number(item.signatureCount) >=
                              Number(threshold) * 0.5
                            ? 'warning' // yellow
                            : 'error' // red
                        "
                        class="mr-2"
                      />
                    </template>
                  </v-tooltip>
                </div>
              </template>

              <!-- Actions -->
              <template v-slot:item.actions="{ item }">
                <div class="d-flex ga-2">
                  <!-- Pending: Sign -->
                  <v-btn
                    v-if="item.status === 'pending'"
                    size="small"
                    color="success"
                    variant="flat"
                    :loading="signingTx === item.id"
                    @click="signPendingTx(item)"
                  >
                    <v-icon>mdi-pen</v-icon>
                    Sign
                  </v-btn>

                  <!-- Pending: Execute -->

                  <v-btn
                    v-if="
                      item.status === 'pending' &&
                      Number(item.signatureCount) >= Number(threshold)
                    "
                    size="small"
                    color="orange"
                    variant="flat"
                    :loading="executingTx === item.id"
                    @click="executePendingTx(item)"
                  >
                    <v-icon>mdi-play</v-icon>
                    Execute
                  </v-btn>

                  <!-- Executed: View on explorer -->
                  <v-btn
                    v-else-if="item.status === 'executed'"
                    size="small"
                    color="primary"
                    variant="outlined"
                    @click="viewOnExplorer(item.txHash)"
                  >
                    <v-icon>mdi-open-in-new</v-icon>
                    View
                  </v-btn>
                </div>
              </template>

              <!-- Expanded Row -->
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
                              />
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
                <code class="text-caption pl-1 pr-1">{{
                  item.createdAt
                    ? relativeTime(new Date(item.createdAt))
                    : 'N/A'
                }}</code>
              </template>

              <!-- Deadline At -->
              <template v-slot:item.deadline="{ item }">
                <code class="text-caption pl-1 pr-1">
                  {{
                    item.deadline ? relativeTime(item.deadline) : 'N/A'
                  }}</code
                >
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
                    <v-icon>mdi-thumb-up</v-icon>
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
                <!-- Transaction Type as radio buttons -->
                <v-col>
                  <v-radio-group v-model="newTransaction.transactionType">
                    <v-radio label="ETH" value="ETH" class="ma-1 pa-2" />
                    <v-radio label="USDC" value="USDC" class="ma-1 pa-2" />
                    <v-radio label="USDT" value="USDT" class="ma-1 pa-2" />
                  </v-radio-group>
                </v-col>

                <!-- Recipient Address (no error rules) -->
                <v-col cols="12">
                  <v-text-field
                    v-model="newTransaction.recipient"
                    label="Send To"
                    placeholder="0x..."
                    variant="outlined"
                    autofocus
                  />
                </v-col>

                <!-- Amount full width -->
                <v-col cols="12">
                  <v-text-field
                    v-model="newTransaction.amount"
                    :label="`Amount`"
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
import { ref, onMounted, watch, unref } from 'vue';
import { useRuntimeConfig, useFetch } from '#app';
import { useMetaMask } from '../composables/useMetaMask';
import { PendingTransaction } from '../types/pending_tx';
import { ethers, parseEther } from 'ethers';
import type { Proposal } from '../types/proposal';
import { MANTIKEY_ABI } from '../abi/mantikey_abi';
import {
  fetchSignatures,
  fetchPendingTxes,
  updateTxStatus,
} from '../composables/pendingTxes';

// utils
import { truncateAddress, formatEther, relativeTime } from '../utils/format';
import { getFunctionColor, getStatusColor } from '../utils/colors';

// Nuxt runtime config
const config = useRuntimeConfig();
const backendURI = config.public.backendURI;
const contractAddress = config.public.contractAddress;
const explorerURI = config.public.explorerURI;
const usdcContract = config.public.usdcContract;
const usdtContract = config.public.usdtContract;
const usdcDecimals = config.public.usdcDecimals;
const usdtDecimals = config.public.usdtDecimals;

// metamask composable
const { isConnected, account, connect, disconnect, getBalance, signMessage } =
  useMetaMask();

const pendingTxHeaders = [
  { title: 'ID', key: 'id', width: '80px' },
  { title: 'Type', key: 'txType' },
  { title: 'To Address', key: 'toAddress', width: '140px' },
  { title: 'Value', key: 'value' },
  { title: 'Status', key: 'status' },
  { title: 'Sigs', key: 'signatureCount' },
  { title: 'Created', key: 'createdAt' },
  { title: 'Actions', key: 'actions', sortable: false },
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
  { title: 'Created', key: 'createdAt', sortable: true, width: '180px' },
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

const signingTx = ref<number | null>(null);
const executingTx = ref<number | null>(null);
const executingProposal = ref<number | null>(null);
const loading = ref(false);
const loadingPending = ref(false); // guard to prevent re-entrancy

// New Transaction Dialog state
const newTransactionDialog = ref(false);

// Transaction data
const newTransaction = ref({
  transactionType: 'ETH',
  recipient: '0x376d1c280197d6a6b2FBBA5E8D7f77fDEE999E06',
  amount: '0.000123',
});

// pending txes
const pendingTransactions = ref<PendingTransaction[]>([]);
const pendingTxOptions = ref({
  page: 1,
  itemsPerPage: 20,
});
const pendingTxTotalItems = ref(0);

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

    const contract = new ethers.Contract(contractAddress, MANTIKEY_ABI, signer);

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

const getPendingTxesFromAPI = async (opts?: { retry?: number }) => {
  // simple guard to avoid re-entrancy/infinite loop
  if (loadingPending.value) {
    console.warn(
      'getPendingTxesFromAPI: call skipped because a fetch is already in progress'
    );
    return;
  }

  loadingPending.value = true;
  console.log('retrieving pending txes...');

  const maxRetries = opts?.retry ?? 2;
  let attempt = 0;

  // Helper: small delay between retries
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  try {
    while (attempt <= maxRetries) {
      attempt++;
      try {
        const page = Number(pendingTxOptions.value.page) || 1;
        const itemsPerPage = Number(pendingTxOptions.value.itemsPerPage) || 20;

        // If fetchPendingTxes uses fetch/axios, consider passing an AbortController (not shown here).
        const { data, pagination } = await fetchPendingTxes(page, itemsPerPage);

        // Defensive: ensure plain JS values to avoid accidental reactivity loops
        pendingTransactions.value = Array.isArray(data) ? [...data] : [];
        pendingTxTotalItems.value = pagination?.total
          ? Number(pagination.total)
          : 0;

        console.log(
          `fetched ${pendingTxTotalItems.value} pending txes from API (attempt ${attempt})`
        );
        // success -> break retry loop
        break;
      } catch (innerErr) {
        console.error(
          `Attempt ${attempt} failed to fetch pending txes:`,
          innerErr
        );

        // If backend unreachable, break and show snackbar once
        if (innerErr?.response == undefined) {
          showSnackbar(
            'API is unreachable. Please configure correctly the backend',
            'error'
          );
          // no point in retrying if no response (optional: still retry once)
          break;
        }

        // if we've exhausted retries, show generic error and stop
        if (attempt > maxRetries) {
          showSnackbar('Failed to fetch pending transactions', 'error');
          break;
        }

        // else wait and retry
        await wait(500 * attempt); // exponential-ish backoff: 500ms, 1000ms, ...
      }
    }
  } catch (err) {
    console.error('Unexpected error in getPendingTxesFromAPI:', err);
    showSnackbar('Failed to fetch pending transactions', 'error');
  } finally {
    loadingPending.value = false;
  }
};

const signPendingTx = async (item) => {
  if (!account.value) {
    showSnackbar('Please connect your wallet first', 'error');
    return;
  }

  signingTx.value = item.id;
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask not found');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Prepare transaction data
    let toAddress = item.toAddress;
    let value = '0';
    let data = '0x';

    if (item.txType === 'eth') {
      // ETH transfer
      value = item.value.toString();
    } else if (item.txType.toLowerCase() === 'erc20') {
      // ERC20 transfer
      const ERC20_ABI = [
        'function transfer(address to, uint256 amount) returns (bool)',
      ];
      const erc20Interface = new ethers.Interface(ERC20_ABI);
      // Convert amount to proper units
      const amount = ethers.parseUnits(
        item.erc20Amount.toString(),
        item.erc20Decimals
      );
      console.log(
        `Preparing Signing ERC20 transfer of ${item.erc20Amount} (raw: ${amount}) to ${toAddress} for contract ${item.erc20Contract}`
      );
      // Encode transfer call
      data = erc20Interface.encodeFunctionData('transfer', [toAddress, amount]);

      // For ERC20, send tx to token contract
      toAddress = item.erc20Contract;
      value = '0';
    }

    // EIP712 domain
    const domain = {
      name: 'MantiKey',
      version: '1',
      chainId: await signer.provider
        .getNetwork()
        .then((n) => Number(n.chainId)),
      verifyingContract: contractAddress,
    };

    const types = {
      Transaction: [
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'data', type: 'bytes' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    };

    const message = {
      to: toAddress,
      value: value,
      data: data,
      nonce: item.nonce,
      deadline: item.deadline,
    };

    console.log('Signing transaction:', { domain, types, message, item });

    // Request signature
    showSnackbar('Please check your wallet to sign the transaction', 'info');
    const signature = await signer.signTypedData(domain, types, message);

    console.log('Transaction signed successfully:', signature);

    const body: Record<string, any> = {
      pendingTxID: item.id,
      signature: signature,
      message: message,
      signer: account.value,
    };

    // Submit signature
    const { dataResponse, error } = await useFetch(`${backendURI}/sign_tx`, {
      method: 'POST',
      body,
    });
    console.log('data from /sign_tx', dataResponse);

    if (error.value) {
      console.error('❌ Failed:', error.value);

      if (error.value.data?.message) {
        showSnackbar(error.value.data.message, 'error');
      } else if (error.value.data?.error) {
        showSnackbar(error.value.data.error, 'error');
      } else {
        showSnackbar('Failed to submit transaction', 'error');
      }
    } else {
      console.log('✅ Transaction submitted');
      showSnackbar('Transaction submitted successfully', 'success');
      newTransactionDialog.value = false;
    }

    await getPendingTxesFromAPI();
  } catch (error: any) {
    console.error('Error signing transaction:', error);

    let errorMessage = 'Failed to sign transaction';
    if (error.code === 'ACTION_REJECTED') {
      errorMessage = 'Transaction signing was rejected by user';
    } else if (error.message.includes('User rejected')) {
      errorMessage = 'Transaction signing was rejected by user';
    } else if (error.message) {
      errorMessage = error.message;
    }

    showSnackbar(errorMessage, 'error');
  }
  signingTx.value = null;
};

const executePendingTx = async (item) => {
  if (!account.value) {
    showSnackbar('Please connect your wallet first', 'error');
    return;
  }

  console.log('trying to execute tx id', item.id);
  executingTx.value = item.id;

  try {
    if (!window.ethereum) throw new Error('MetaMask not found');

    // 1. Fetch sigs from backend
    const { signatures } = await fetchSignatures(Number(item.id));

    if (signatures.length === 0) {
      showSnackbar('No signatures collected yet', 'warning');
      return;
    }

    // 2. Setup provider & signer
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // 3. Connect contract
    const contract = new ethers.Contract(contractAddress, MANTIKEY_ABI, signer);

    // Extract only raw hex signatures
    const sigs: string[] = signatures.map((s) => s.signature);

    // 4. Rebuild tx fields (don’t use item.data directly for ERC20)
    let toAddress = item.toAddress;
    let value = item.value;
    let data = item.data ?? '0x';

    if (item.txType.toLowerCase() === 'erc20') {
      const ERC20_ABI = [
        'function transfer(address to, uint256 amount) returns (bool)',
      ];
      const erc20Interface = new ethers.Interface(ERC20_ABI);

      // Pick correct decimals
      const contractAddr = item.erc20Contract?.toLowerCase() ?? '';

      const amount = ethers.parseUnits(
        item.erc20Amount ?? '0',
        item.erc20Decimals
      );

      // Encode transfer(to, amount)
      data = erc20Interface.encodeFunctionData('transfer', [
        item.toAddress,
        amount,
      ]);

      // For ERC20, tx is sent to the token contract
      toAddress = item.erc20Contract!;
      value = '0';
    }

    // 5. Execute multisig contract call
    const tx = await contract.execute(
      toAddress,
      value,
      data,
      item.nonce,
      item.deadline,
      sigs
    );

    showSnackbar(`Transaction sent. Please wait`, 'success');

    const receipt = await tx.wait();
    lastTxHash.value = receipt.hash;
    txHashDialog.value = true;

    await updateTxStatus(item.id, receipt.hash);
    await getPendingTxesFromAPI();
  } catch (error: any) {
    console.error('Error executing transaction:', error);
    showSnackbar(error.message, 'error');
  } finally {
    executingTx.value = null;
  }
};

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

    contractBalanceETH.value = (await getBalance(contractAddress)) ?? 0;
    console.log('contract ETH balance', contractBalanceETH.value);

    const provider = new ethers.BrowserProvider(window.ethereum);
    //const signer = await provider.getSigner();

    const contractUSDC = new ethers.Contract(usdcContract, ERC20_ABI, provider);
    const contractUSDT = new ethers.Contract(usdtContract, ERC20_ABI, provider);

    let balanceUSDCRaw = await contractUSDC.balanceOf(contractAddress);

    contractBalanceUSDC.value = Number(
      ethers.formatUnits(balanceUSDCRaw, Number(usdcDecimals))
    );
    console.log('contract USDC balance', contractBalanceUSDC.value);
    await sleep(500);
    let balanceUSDTRaw = await contractUSDT.balanceOf(contractAddress);
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

    const contract = new ethers.Contract(
      contractAddress,
      MANTIKEY_ABI,
      provider
    );

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
    const contract = new ethers.Contract(contractAddress, MANTIKEY_ABI, signer);

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
  getPendingTxesFromAPI();
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
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

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

watch(
  () => ({ ...pendingTxOptions.value }),
  () => {
    getPendingTxesFromAPI();
  },
  { deep: true, immediate: true }
);

const submitTransaction = async () => {
  if (!formValid.value) return;

  submitting.value = true;

  console.log('Submitting new transaction:', newTransaction.value);

  try {
    //get the nonce
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, MANTIKEY_ABI, signer);
    const nonce = Number(await contract.nonce());
    console.log('Current nonce:', nonce);

    let body: Record<string, any> = {
      toAddress: newTransaction.value.recipient,
      data: null,
      nonce: nonce,
      deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 min from now
    };

    if (newTransaction.value.transactionType === 'ETH') {
      body.txType = 'eth';
      body.value = parseEther(newTransaction.value.amount).toString(); // wei
      body.erc20Contract = null;
      body.erc20Amount = null;
      body.erc20Symbol = null;
      body.erc20Decimals = null;
    } else if (newTransaction.value.transactionType === 'USDC') {
      body.txType = 'erc20';
      body.value = '0';
      body.erc20Contract = config.public.usdcContract;
      body.erc20Amount = newTransaction.value.amount;
      body.erc20Symbol = 'USDC';
      body.erc20Decimals = config.public.usdcDecimals;
    } else if (newTransaction.value.transactionType === 'USDT') {
      body.txType = 'erc20';
      body.value = '0';
      body.erc20Contract = config.public.usdtContract;
      body.erc20Amount = newTransaction.value.amount;
      body.erc20Symbol = 'USDT';
      body.erc20Decimals = config.public.usdtDecimals;
    }

    const { error } = await useFetch(backendURI + '/pending_transaction', {
      method: 'POST',
      body,
    });

    if (error.value) {
      console.error('❌ Failed:', error.value);
    } else {
      console.log('✅ Transaction submitted');
      showSnackbar('Transaction submitted successfully', 'success');
      newTransactionDialog.value = false;
      await getPendingTxesFromAPI();
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  } finally {
    submitting.value = false;
  }
};
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
