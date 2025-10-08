import * as vscode from "vscode";

interface Collection {
  id: string;
  name: string;
  description?: string;
  requests: string[];
  createdAt: string;
  updatedAt: string;
}

interface SavedRequest {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: {
    key: string;
    value: string;
    description: string;
    disabled: boolean;
  }[];
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
  queryParams: {
    key: string;
    value: string;
    description: string;
    disabled: boolean;
  }[];
  createdAt: string;
  updatedAt: string;
}

export class CollectionTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly itemType: "collection" | "request",
    public readonly itemId: string,
    public readonly method?: string
  ) {
    super(label, collapsibleState);

    this.contextValue = itemType;
    this.id = itemId;

    if (itemType === "request" && method) {
      this.iconPath = this.getMethodIcon(method);
      this.description = method.toUpperCase();
      this.command = {
        command: "postcode.loadRequest",
        title: "Load Request",
        arguments: [this],
      };
    } else if (itemType === "collection") {
      this.iconPath = new vscode.ThemeIcon("folder");
    }
  }

  private getMethodIcon(method: string): vscode.ThemeIcon {
    const iconMap: { [key: string]: string } = {
      GET: "arrow-down",
      POST: "arrow-up",
      PUT: "pencil",
      DELETE: "trash",
      PATCH: "diff-modified",
      HEAD: "eye",
      OPTIONS: "settings-gear",
    };
    return new vscode.ThemeIcon(iconMap[method.toUpperCase()] || "globe");
  }
}

export class CollectionsProvider
  implements vscode.TreeDataProvider<CollectionTreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    CollectionTreeItem | undefined | null | void
  > = new vscode.EventEmitter<CollectionTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    CollectionTreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private collections: Collection[] = [];
  private requests: Record<string, SavedRequest> = {};

  constructor(private context: vscode.ExtensionContext) {
    this.loadData();
  }

  refresh(): void {
    this.loadData();
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: CollectionTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: CollectionTreeItem): Thenable<CollectionTreeItem[]> {
    if (!element) {
      // Root level - return collections
      return Promise.resolve(
        this.collections.map(
          (collection) =>
            new CollectionTreeItem(
              collection.name,
              vscode.TreeItemCollapsibleState.Collapsed,
              "collection",
              collection.id
            )
        )
      );
    } else if (element.itemType === "collection") {
      // Collection level - return requests
      const collection = this.collections.find((c) => c.id === element.itemId);
      if (!collection) return Promise.resolve([]);

      return Promise.resolve(
        collection.requests
          .map((requestId) => this.requests[requestId])
          .filter(Boolean)
          .map(
            (request) =>
              new CollectionTreeItem(
                request.name,
                vscode.TreeItemCollapsibleState.None,
                "request",
                request.id,
                request.method
              )
          )
      );
    }

    return Promise.resolve([]);
  }

  // Data management methods
  private loadData(): void {
    const collectionsData =
      this.context.workspaceState.get<Collection[]>("postcode.collections") ||
      [];
    const requestsData =
      this.context.workspaceState.get<Record<string, SavedRequest>>(
        "postcode.requests"
      ) || {};

    this.collections = collectionsData;
    this.requests = requestsData;
  }

  private async saveData(): Promise<void> {
    await this.context.workspaceState.update(
      "postcode.collections",
      this.collections
    );
    await this.context.workspaceState.update(
      "postcode.requests",
      this.requests
    );
  }

  async createCollection(name: string): Promise<void> {
    const newCollection: Collection = {
      id: Date.now().toString(),
      name,
      requests: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.collections.push(newCollection);
    await this.saveData();
    this.refresh();
  }

  async saveRequest(
    request: Omit<SavedRequest, "id" | "createdAt" | "updatedAt">,
    collectionId: string
  ): Promise<void> {
    const requestId = Date.now().toString();
    const newRequest: SavedRequest = {
      ...request,
      id: requestId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.requests[requestId] = newRequest;

    const collection = this.collections.find((c) => c.id === collectionId);
    if (collection) {
      collection.requests.push(requestId);
      collection.updatedAt = new Date().toISOString();
    }

    await this.saveData();
    this.refresh();
  }

  async deleteCollection(collectionId: string): Promise<void> {
    const collection = this.collections.find((c) => c.id === collectionId);
    if (collection) {
      // Delete all requests in the collection
      collection.requests.forEach((requestId) => {
        delete this.requests[requestId];
      });

      // Remove the collection
      this.collections = this.collections.filter((c) => c.id !== collectionId);

      await this.saveData();
      this.refresh();
    }
  }

  async deleteRequest(requestId: string): Promise<void> {
    delete this.requests[requestId];

    // Remove from all collections
    this.collections.forEach((collection) => {
      collection.requests = collection.requests.filter(
        (id) => id !== requestId
      );
      collection.updatedAt = new Date().toISOString();
    });

    await this.saveData();
    this.refresh();
  }

  async renameItem(
    itemId: string,
    itemType: "collection" | "request",
    newName: string
  ): Promise<void> {
    if (itemType === "collection") {
      const collection = this.collections.find((c) => c.id === itemId);
      if (collection) {
        collection.name = newName;
        collection.updatedAt = new Date().toISOString();
      }
    } else if (itemType === "request") {
      const request = this.requests[itemId];
      if (request) {
        request.name = newName;
        request.updatedAt = new Date().toISOString();
      }
    }

    await this.saveData();
    this.refresh();
  }

  getRequest(requestId: string): SavedRequest | undefined {
    return this.requests[requestId];
  }

  getCollections(): Collection[] {
    return this.collections;
  }
}
