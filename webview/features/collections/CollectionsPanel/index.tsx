import * as React from "react";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes } from "react-icons/fa";
import {
  selectCollections,
  selectRequestsByCollectionId,
  addCollection,
  updateCollection,
  deleteCollection,
  saveRequest,
  deleteRequest,
} from "../collectionsSlice";
import type { SavedRequest } from "../collectionsSlice";
import "./styles.css";

interface CollectionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentRequest: Omit<SavedRequest, "id" | "createdAt" | "updatedAt">;
  onLoadRequest: (request: SavedRequest) => void;
}

export const CollectionsPanel: React.FC<CollectionsPanelProps> = ({
  isOpen,
  onClose,
  currentRequest,
  onLoadRequest,
}) => {
  const dispatch = useAppDispatch();
  const collections = useAppSelector(selectCollections);

  const [newCollectionName, setNewCollectionName] = React.useState("");
  const [editingCollection, setEditingCollection] =
    React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState("");
  const [selectedCollectionId, setSelectedCollectionId] =
    React.useState<string | null>(null);
  const [requestName, setRequestName] = React.useState("");

  const selectedRequests = useAppSelector((state) =>
    selectedCollectionId
      ? selectRequestsByCollectionId(state, selectedCollectionId)
      : []
  );

  const handleCreateCollection = () => {
    if (newCollectionName.trim()) {
      dispatch(
        addCollection({
          name: newCollectionName,
          requests: [],
        })
      );
      setNewCollectionName("");
    }
  };

  const handleUpdateCollection = (collectionId: string) => {
    if (editingName.trim()) {
      dispatch(
        updateCollection({
          id: collectionId,
          updates: { name: editingName },
        })
      );
      setEditingCollection(null);
      setEditingName("");
    }
  };

  const handleDeleteCollection = (collectionId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this collection and all its requests?"
    );
    if (confirmed) {
      dispatch(deleteCollection(collectionId));
    }
  };

  const handleSaveRequest = () => {
    if (requestName.trim() && selectedCollectionId) {
      dispatch(
        saveRequest({
          request: {
            ...currentRequest,
            name: requestName,
          },
          collectionId: selectedCollectionId,
        })
      );
      setRequestName("");
    }
  };

  const handleDeleteRequest = (requestId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this request?"
    );
    if (confirmed) {
      dispatch(deleteRequest(requestId));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="collections-overlay">
      <div className="collections-panel">
        <div className="collections-header">
          <h2>Collections</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="collections-content">
          {/* Create new collection */}
          <div className="section">
            <h3>Create Collection</h3>
            <div className="input-group">
              <input
                type="text"
                placeholder="Collection name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && handleCreateCollection()
                }
              />
              <button onClick={handleCreateCollection}>
                <FaPlus />
              </button>
            </div>
          </div>

          {/* Collections list */}
          <div className="section">
            <h3>Collections</h3>
            <div className="collections-list">
              {collections.map((collection) => (
                <div key={collection.id} className="collection-item">
                  {editingCollection === collection.id ? (
                    <div className="editing-row">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" &&
                          handleUpdateCollection(collection.id)
                        }
                      />
                      <button
                        onClick={() => handleUpdateCollection(collection.id)}
                      >
                        <FaSave />
                      </button>
                      <button onClick={() => setEditingCollection(null)}>
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <div className="collection-row">
                      <span
                        className={`collection-name ${
                          selectedCollectionId === collection.id
                            ? "selected"
                            : ""
                        }`}
                        onClick={() => setSelectedCollectionId(collection.id)}
                      >
                        {collection.name} ({collection.requests.length})
                      </span>
                      <div className="collection-actions">
                        <button
                          onClick={() => {
                            setEditingCollection(collection.id);
                            setEditingName(collection.name);
                          }}
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteCollection(collection.id)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Save current request */}
          {selectedCollectionId && (
            <div className="section">
              <h3>Save Current Request</h3>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Request name"
                  value={requestName}
                  onChange={(e) => setRequestName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSaveRequest()}
                />
                <button onClick={handleSaveRequest}>
                  <FaSave />
                </button>
              </div>
            </div>
          )}

          {/* Requests in selected collection */}
          {selectedCollectionId && (
            <div className="section">
              <h3>Saved Requests</h3>
              <div className="requests-list">
                {selectedRequests.map((request) => (
                  <div key={request.id} className="request-item">
                    <div className="request-info">
                      <span className="request-method">{request.method}</span>
                      <span className="request-name">{request.name}</span>
                      <span className="request-url">{request.url}</span>
                    </div>
                    <div className="request-actions">
                      <button onClick={() => onLoadRequest(request)}>
                        Load
                      </button>
                      <button onClick={() => handleDeleteRequest(request.id)}>
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
                {selectedRequests.length === 0 && (
                  <p>No requests in this collection</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
