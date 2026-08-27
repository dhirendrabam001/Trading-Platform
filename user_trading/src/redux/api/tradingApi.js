import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  BANK_ACCOUNT_API_END_POINT,
  KYC_API_END_POINT,
  LOGIN_URL,
  MARKET_API_END_POINT,
  NOTIFICATION_API_END_POINT,
  ORDER_API_END_POINT,
  PORTFOLIO_API_END_POINT,
  SESSION_API_END_POINT,
  SUPPORT_API_END_POINT,
  USER_API_END_POINT,
  WALLET_API_END_POINT,
} from "../../apis/apis";

/* ===========================================================================
   ONE PLACE FOR EVERY API CALL

   Why RTK Query instead of writing a thunk per page:

     - a page becomes ONE line:  const { data, isLoading } = useGetWalletBalancesQuery()
     - loading and error states are handled for you
     - responses are cached, so two pages asking for balances make one request
     - "tags" below mean placing an order automatically refreshes the wallet,
       the orders list and the portfolio — you never write that wiring

   To add an endpoint: add it to `endpoints`, then use the hook it generates.
   `getWalletBalances` automatically becomes `useGetWalletBalancesQuery`.
   =========================================================================== */

/**
 * Sends the login cookie with every request.
 * The session is an httpOnly cookie, so there is no token to attach by hand —
 * the browser does it, as long as `credentials: "include"` is set.
 */
const rawBaseQuery = fetchBaseQuery({ credentials: "include" });

/**
 * Wraps every request so an expired session sends the user to the login page
 * instead of leaving a dashboard on screen whose every call is failing.
 */
let redirecting = false;

const baseQuery = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401 && !redirecting) {
    redirecting = true;
    window.location.replace(LOGIN_URL);
  }

  return result;
};

export const tradingApi = createApi({
  reducerPath: "tradingApi",
  baseQuery,

  // Every cached response is labelled with one of these. A mutation that
  // "invalidates" a tag makes anything holding that tag refetch itself.
  tagTypes: [
    "Balance",
    "Ledger",
    "Order",
    "Fill",
    "Portfolio",
    "Notification",
    "Bank",
    "Ticket",
    "Kyc",
    "Session",
    "Profile",
  ],

  endpoints: (builder) => ({
    /* ==================================================== MARKET ======== */

    getAssets: builder.query({
      query: () => `${MARKET_API_END_POINT}/assets`,
    }),

    getTickers: builder.query({
      query: () => `${MARKET_API_END_POINT}/tickers`,
      // Prices move constantly, so this refreshes itself while a page using
      // it is open. Everything else only refetches when something changes.
      keepUnusedDataFor: 10,
    }),

    getTicker: builder.query({
      query: (symbol) => `${MARKET_API_END_POINT}/ticker/${symbol}`,
    }),

    getCandles: builder.query({
      query: ({ symbol, interval = "15m", limit = 100 }) =>
        `${MARKET_API_END_POINT}/candles/${symbol}?interval=${interval}&limit=${limit}`,
    }),

    getOrderBook: builder.query({
      query: ({ symbol, limit = 20 }) =>
        `${MARKET_API_END_POINT}/orderbook/${symbol}?limit=${limit}`,
    }),

    /* ==================================================== WALLET ======== */

    getWalletBalances: builder.query({
      query: () => `${WALLET_API_END_POINT}/balances`,
      providesTags: ["Balance"],
    }),

    getWalletLimits: builder.query({
      query: () => `${WALLET_API_END_POINT}/limits`,
      providesTags: ["Balance"],
    }),

    getLedger: builder.query({
      query: ({ type, asset, page = 1, limit = 50 } = {}) => {
        const params = new URLSearchParams({ page, limit });
        if (type) params.set("type", type);
        if (asset) params.set("asset", asset);
        return `${WALLET_API_END_POINT}/ledger?${params}`;
      },
      providesTags: ["Ledger"],
    }),

    deposit: builder.mutation({
      query: (body) => ({
        url: `${WALLET_API_END_POINT}/deposit`,
        method: "POST",
        body,
      }),
      // Money moved, so the wallet, the transaction list, the portfolio and
      // the bell all need to catch up.
      invalidatesTags: ["Balance", "Ledger", "Portfolio", "Notification"],
    }),

    withdraw: builder.mutation({
      query: (body) => ({
        url: `${WALLET_API_END_POINT}/withdraw`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Balance", "Ledger", "Portfolio", "Notification"],
    }),

    /* ==================================================== ORDERS ======== */

    getOrders: builder.query({
      query: ({ status = "all", page = 1, limit = 50 } = {}) =>
        `${ORDER_API_END_POINT}?status=${status}&page=${page}&limit=${limit}`,
      providesTags: ["Order"],
    }),

    getFills: builder.query({
      query: ({ page = 1, limit = 50 } = {}) =>
        `${ORDER_API_END_POINT}/fills?page=${page}&limit=${limit}`,
      providesTags: ["Fill"],
    }),

    // Fees and the minimum order size come from the server, so the Buy/Sell
    // page never hardcodes a rate that could drift from what is charged.
    getOrderRules: builder.query({
      query: () => `${ORDER_API_END_POINT}/rules`,
    }),

    placeOrder: builder.mutation({
      query: (body) => ({
        url: ORDER_API_END_POINT,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        "Balance",
        "Order",
        "Fill",
        "Portfolio",
        "Ledger",
        "Notification",
      ],
    }),

    cancelOrder: builder.mutation({
      query: (id) => ({
        url: `${ORDER_API_END_POINT}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Balance", "Order", "Ledger"],
    }),

    /* ================================================= PORTFOLIO ======== */

    getPortfolioSummary: builder.query({
      query: () => `${PORTFOLIO_API_END_POINT}/summary`,
      providesTags: ["Portfolio"],
    }),

    getHoldings: builder.query({
      query: () => `${PORTFOLIO_API_END_POINT}/holdings`,
      providesTags: ["Portfolio"],
    }),

    getPnl: builder.query({
      query: (days = 30) => `${PORTFOLIO_API_END_POINT}/pnl?days=${days}`,
      providesTags: ["Portfolio"],
    }),

    getPerformance: builder.query({
      query: (days = 90) =>
        `${PORTFOLIO_API_END_POINT}/performance?days=${days}`,
      providesTags: ["Portfolio"],
    }),

    /* ============================================== NOTIFICATIONS ======= */

    getNotifications: builder.query({
      query: ({ category, unreadOnly = false, page = 1, limit = 50 } = {}) => {
        const params = new URLSearchParams({ page, limit, unreadOnly });
        if (category) params.set("category", category);
        return `${NOTIFICATION_API_END_POINT}?${params}`;
      },
      providesTags: ["Notification"],
    }),

    // What the Navbar bell should read instead of its hardcoded 5
    getUnreadCount: builder.query({
      query: () => `${NOTIFICATION_API_END_POINT}/unread-count`,
      providesTags: ["Notification"],
    }),

    markNotificationRead: builder.mutation({
      query: (id) => ({
        url: `${NOTIFICATION_API_END_POINT}/${id}/read`,
        method: "PATCH",
      }),
      invalidatesTags: ["Notification"],
    }),

    markAllNotificationsRead: builder.mutation({
      query: () => ({
        url: `${NOTIFICATION_API_END_POINT}/read-all`,
        method: "POST",
      }),
      invalidatesTags: ["Notification"],
    }),

    deleteNotification: builder.mutation({
      query: (id) => ({
        url: `${NOTIFICATION_API_END_POINT}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notification"],
    }),

    /* ============================================== BANK ACCOUNTS ======= */

    getBankAccounts: builder.query({
      query: () => BANK_ACCOUNT_API_END_POINT,
      providesTags: ["Bank"],
    }),

    addBankAccount: builder.mutation({
      query: (body) => ({
        url: BANK_ACCOUNT_API_END_POINT,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Bank"],
    }),

    setDefaultBankAccount: builder.mutation({
      query: (id) => ({
        url: `${BANK_ACCOUNT_API_END_POINT}/${id}/default`,
        method: "PATCH",
      }),
      invalidatesTags: ["Bank"],
    }),

    deleteBankAccount: builder.mutation({
      query: (id) => ({
        url: `${BANK_ACCOUNT_API_END_POINT}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Bank"],
    }),

    /* =================================================== SUPPORT ======== */

    getTickets: builder.query({
      query: (status = "all") =>
        `${SUPPORT_API_END_POINT}/tickets?status=${status}`,
      providesTags: ["Ticket"],
    }),

    getTicket: builder.query({
      query: (id) => `${SUPPORT_API_END_POINT}/tickets/${id}`,
      providesTags: ["Ticket"],
    }),

    createTicket: builder.mutation({
      query: (body) => ({
        url: `${SUPPORT_API_END_POINT}/tickets`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Ticket"],
    }),

    replyToTicket: builder.mutation({
      query: ({ id, message }) => ({
        url: `${SUPPORT_API_END_POINT}/tickets/${id}/messages`,
        method: "POST",
        body: { message },
      }),
      invalidatesTags: ["Ticket"],
    }),

    closeTicket: builder.mutation({
      query: (id) => ({
        url: `${SUPPORT_API_END_POINT}/tickets/${id}/close`,
        method: "PATCH",
      }),
      invalidatesTags: ["Ticket"],
    }),

    /* ======================================================= KYC ======== */

    getKycStatus: builder.query({
      query: () => KYC_API_END_POINT,
      providesTags: ["Kyc"],
    }),

    submitKycStep: builder.mutation({
      // Documents are files, so this sends FormData rather than JSON.
      // Do NOT set a Content-Type header — the browser has to add the
      // multipart boundary itself, and setting it by hand breaks the upload.
      query: ({ step, formData }) => ({
        url: `${KYC_API_END_POINT}/${step}`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Kyc", "Profile"],
    }),

    /* =================================================== SESSIONS ======= */

    getSessions: builder.query({
      query: () => `${SESSION_API_END_POINT}/getSessions`,
      providesTags: ["Session"],
    }),

    revokeSession: builder.mutation({
      query: (id) => ({
        url: `${SESSION_API_END_POINT}/${id}/revoke`,
        method: "PATCH",
      }),
      invalidatesTags: ["Session"],
    }),

    /* ==================================================== PROFILE ======= */

    getProfile: builder.query({
      query: () => `${USER_API_END_POINT}/getProfile`,
      providesTags: ["Profile"],
    }),

    updateProfile: builder.mutation({
      query: (formData) => ({
        url: `${USER_API_END_POINT}/profile`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ["Profile"],
    }),

    changePassword: builder.mutation({
      query: (body) => ({
        url: `${USER_API_END_POINT}/changePass`,
        method: "PUT",
        body,
      }),
    }),
  }),
});

/* Hooks are generated from the endpoint names above.
   getWalletBalances -> useGetWalletBalancesQuery
   placeOrder        -> usePlaceOrderMutation                                */
export const {
  // market
  useGetAssetsQuery,
  useGetTickersQuery,
  useGetTickerQuery,
  useGetCandlesQuery,
  useGetOrderBookQuery,
  // wallet
  useGetWalletBalancesQuery,
  useGetWalletLimitsQuery,
  useGetLedgerQuery,
  useDepositMutation,
  useWithdrawMutation,
  // orders
  useGetOrdersQuery,
  useGetFillsQuery,
  useGetOrderRulesQuery,
  usePlaceOrderMutation,
  useCancelOrderMutation,
  // portfolio
  useGetPortfolioSummaryQuery,
  useGetHoldingsQuery,
  useGetPnlQuery,
  useGetPerformanceQuery,
  // notifications
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
  // bank accounts
  useGetBankAccountsQuery,
  useAddBankAccountMutation,
  useSetDefaultBankAccountMutation,
  useDeleteBankAccountMutation,
  // support
  useGetTicketsQuery,
  useGetTicketQuery,
  useCreateTicketMutation,
  useReplyToTicketMutation,
  useCloseTicketMutation,
  // kyc
  useGetKycStatusQuery,
  useSubmitKycStepMutation,
  // sessions
  useGetSessionsQuery,
  useRevokeSessionMutation,
  // profile
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} = tradingApi;
