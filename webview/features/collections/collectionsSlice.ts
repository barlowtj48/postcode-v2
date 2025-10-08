import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../redux/store";

interface QueryParam {
  key: string;
  value: string;
  description: string;
  disabled: boolean;
}

interface HeaderParam {
  key: string;
  value: string;
  description: string;
  disabled: boolean;
}

export interface SavedRequest {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: HeaderParam[];
  body: {
    mode?: string;
    disabled: boolean;
    raw: string;
    file: string;
    fileData: string;
    formdata: { key: string; value: string; description: string }[];
    urlencoded: { key: string; value: string; description: string }[];
    options: unknown;
    graphql: { query: string; variables: string };
    format: boolean;
  };
  auth: {
    type: string;
    basic?: { username: string; password: string };
    bearer?: { token: string };
  };
  queryParams: QueryParam[];
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  requests: string[];
  createdAt: string;
  updatedAt: string;
}

interface CollectionsState {
  collections: Collection[];
  requests: Record<string, SavedRequest>;
  isLoading: boolean;
  error: string | null;
}

const initialState: CollectionsState = {
  collections: [],
  requests: {},
  isLoading: false,
  error: null,
};

const collectionsSlice = createSlice({
  name: "collections",
  initialState,
  reducers: {
    // Collection actions
    addCollection: (
      state,
      action: PayloadAction<Omit<Collection, "id" | "createdAt" | "updatedAt">>
    ) => {
      const newCollection: Collection = {
        ...action.payload,
        id: Date.now().toString(),
        requests: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.collections.push(newCollection);
    },

    updateCollection: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<Collection> }>
    ) => {
      const { id, updates } = action.payload;
      const collection = state.collections.find((c) => c.id === id);
      if (collection) {
        Object.assign(collection, updates, {
          updatedAt: new Date().toISOString(),
        });
      }
    },

    deleteCollection: (state, action: PayloadAction<string>) => {
      const collectionId = action.payload;
      const collection = state.collections.find((c) => c.id === collectionId);
      if (collection) {
        // Delete all requests in this collection
        collection.requests.forEach((requestId) => {
          delete state.requests[requestId];
        });
        // Remove the collection
        state.collections = state.collections.filter(
          (c) => c.id !== collectionId
        );
      }
    },

    // Request actions
    saveRequest: (
      state,
      action: PayloadAction<{
        request: Omit<SavedRequest, "id" | "createdAt" | "updatedAt">;
        collectionId: string;
      }>
    ) => {
      const { request, collectionId } = action.payload;
      const requestId = Date.now().toString();

      const newRequest: SavedRequest = {
        ...request,
        id: requestId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      state.requests[requestId] = newRequest;

      // Add request to collection
      const collection = state.collections.find((c) => c.id === collectionId);
      if (collection) {
        collection.requests.push(requestId);
        collection.updatedAt = new Date().toISOString();
      }
    },

    updateRequest: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<SavedRequest> }>
    ) => {
      const { id, updates } = action.payload;
      const request = state.requests[id];
      if (request) {
        Object.assign(request, updates, {
          updatedAt: new Date().toISOString(),
        });
      }
    },

    deleteRequest: (state, action: PayloadAction<string>) => {
      const requestId = action.payload;
      delete state.requests[requestId];

      // Remove from all collections
      state.collections.forEach((collection) => {
        collection.requests = collection.requests.filter(
          (id) => id !== requestId
        );
        collection.updatedAt = new Date().toISOString();
      });
    },

    // Storage actions
    loadCollectionsData: (
      state,
      action: PayloadAction<{
        collections: Collection[];
        requests: Record<string, SavedRequest>;
      }>
    ) => {
      const { collections, requests } = action.payload;
      state.collections = collections;
      state.requests = requests;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  addCollection,
  updateCollection,
  deleteCollection,
  saveRequest,
  updateRequest,
  deleteRequest,
  loadCollectionsData,
  setLoading,
  setError,
} = collectionsSlice.actions;

// Selectors
export const selectCollections = (state: RootState) =>
  state.collections.collections;

export const selectAllRequests = (state: RootState) =>
  state.collections.requests;

export const selectCollectionById = (state: RootState, id: string) =>
  state.collections.collections.find((collection) => collection.id === id);

export const selectRequestById = (state: RootState, id: string) =>
  state.collections.requests[id];

export const selectRequestsByCollectionId = (
  state: RootState,
  collectionId: string
) => {
  const collection = selectCollectionById(state, collectionId);
  if (!collection) return [];
  return collection.requests
    .map((requestId) => state.collections.requests[requestId])
    .filter(Boolean);
};

export const selectCollectionsLoading = (state: RootState) =>
  state.collections.isLoading;

export const selectCollectionsError = (state: RootState) =>
  state.collections.error;

export default collectionsSlice.reducer;
