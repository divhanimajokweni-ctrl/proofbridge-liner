import { App, Plugin, PluginSettingTab, Setting, Notice, TFile, TFolder, WorkspaceLeaf, ItemView, MarkdownView } from "obsidian";

// ─── View Types ───────────────────────────────────────────────────────────────
const WAR_ROOM_VIEW_TYPE = "vvu-war-room-view";

interface WarRoomViewData {
  refreshToken?: number;
}

class WarRoomView extends ItemView {
  constructor(leaf: WorkspaceLeaf, private plugin: VvuWarRoomPlugin) {
    super(leaf);
  }

  getViewType(): string {
    return WAR_ROOM_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "VVU War Room";
  }

  getIcon(): string {
    return "shield";
  }

  async onOpen() {
    this.render();
  }

  async onClose() {
    // nothing to clean up
  }

  private render() {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.createEl("h2", { text: "VVU War Room" });
    container.createEl("p", { text: "Operational dashboard placeholder. Wire real telemetry here." });
  }
}

// ─── Plugin Settings ──────────────────────────────────────────────────────────
interface VvuWarRoomSettings {
  dailyNoteFolder: string;
  complianceFolder: string;
  gatewayUrl: string;
  gatewayToken: string;
  openclawEnabled: boolean;
}

const DEFAULT_SETTINGS: VvuWarRoomSettings = {
  dailyNoteFolder: "daily",
  complianceFolder: "compliance",
  gatewayUrl: "http://127.0.0.1:18789",
  gatewayToken: "",
  openclawEnabled: false,
};

// ─── Plugin ───────────────────────────────────────────────────────────────────
export default class VvuWarRoomPlugin extends Plugin {
  settings: VvuWarRoomSettings = DEFAULT_SETTINGS;
  private statusBarItem!: HTMLElement;

  async onload() {
    await this.loadSettings();

    this.loadStyles();

    // Register War Room view
    this.registerView(
      WAR_ROOM_VIEW_TYPE,
      (leaf) => new WarRoomView(leaf, this)
    );

    // Ribbon: Open War Room dashboard
    this.addRibbonIcon("shield", "Open VVU War Room", () => {
      this.activateView();
    });

    // Ribbon: New daily note
    this.addRibbonIcon("calendar", "New VVU Daily Note", () => {
      this.createDailyNote();
    });

    // Command: Open War Room
    this.addCommand({
      id: "open-war-room",
      name: "Open VVU War Room",
      callback: () => this.activateView(),
    });

    // Command: New daily note
    this.addCommand({
      id: "new-daily-note",
      name: "Create VVU daily note",
      callback: () => this.createDailyNote(),
    });

    // Command: Insert compliance link
    this.addCommand({
      id: "insert-compliance-link",
      name: "Insert compliance document link",
      editorCallback: (editor) => this.insertComplianceLink(editor),
    });

    // Command: Search vault for compliance
    this.addCommand({
      id: "search-compliance",
      name: "Search vault for compliance items",
      callback: () => this.searchCompliance(),
    });

    // Command: Ping gateway health
    this.addCommand({
      id: "ping-gateway",
      name: "Ping OpenClaw gateway",
      callback: () => this.pingGateway(),
    });

    // Status bar
    this.statusBarItem = this.addStatusBarItem();
    this.statusBarItem.addClass("vvu-status-bar");
    this.updateStatusBar();

    // Settings tab
    this.addSettingTab(new VvuWarRoomSettingTab(this.app, this));
  }

  onunload() {
    // views are disposed automatically
  }

  private loadStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .vvu-status-bar { color: #8b949e; }
      .vvu-status-live { color: #3fb950; }
    `;
    document.head.appendChild(style);
  }

  // ─── Views ────────────────────────────────────────────────────────────────
  private async activateView() {
    const { workspace } = this.app;
    let leaf: WorkspaceLeaf | null = null;

    const leaves = workspace.getLeavesOfType(WAR_ROOM_VIEW_TYPE);
    if (leaves.length > 0) {
      leaf = leaves[0];
    } else {
      leaf = workspace.getRightLeaf(false);
      await leaf?.setViewState({ type: WAR_ROOM_VIEW_TYPE, active: true });
    }

    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }

  // ─── Daily Notes ───────────────────────────────────────────────────────────
  private async createDailyNote() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const folder = this.settings.dailyNoteFolder.replace(/\/+$/, "");
    const fileName = `${folder}/${dateStr}.md`;

    let file = this.app.vault.getAbstractFileByPath(fileName) as TFile | null;
    if (!file) {
      await this.ensureFolder(folder);
      await this.app.vault.create(fileName, this.dailyNoteTemplate(dateStr));
      file = this.app.vault.getAbstractFileByPath(fileName) as TFile;
      new Notice(`Created daily note: ${fileName}`);
    } else {
      new Notice(`Daily note already exists: ${fileName}`);
    }

    await this.app.workspace.openLinkText(fileName, "");
  }

  private dailyNoteTemplate(date: string): string {
    return `# VVU War Room — ${date}

## Daily Standup
- [ ] Item 1
- [ ] Item 2
- [ ] Item 3

## OpenClaw Status
<!-- Gateway connectivity check: ${this.settings.gatewayUrl} -->

## Compliance Pulse
- FSCA filings:
- POPIA incidents:
- SAR/STR register updates:

## Incident Log
| Time | Severity | Description | Status |
|------|----------|-------------|--------|
|      |          |             |        |

## Action Items
- [ ] 

## Notes
`;
  }

  // ─── Compliance Quick-Links ────────────────────────────────────────────────
  private async insertComplianceLink(editor: any) {
    const files = this.app.vault.getMarkdownFiles();
    const complianceFiles = files.filter((f) =>
      f.path.startsWith(this.settings.complianceFolder)
    );

    if (complianceFiles.length === 0) {
      new Notice("No compliance documents found in " + this.settings.complianceFolder);
      return;
    }

    const chosen = complianceFiles[0];
    const link = `[[${chosen.path.replace(/\.md$/, "")}]]`;
    editor.replaceRange(link, editor.getCursor());
    new Notice(`Inserted: ${chosen.name}`);
  }

  private async searchCompliance() {
    const query = "compliance";
    const files = this.app.vault.getMarkdownFiles();
    const results = files.filter((f) =>
      f.path.toLowerCase().includes(query.toLowerCase())
    );

    if (results.length === 0) {
      new Notice("No compliance files found");
      return;
    }

    const list = results.map((f) => `- [[${f.path.replace(/\.md$/, "")}]]`).join("\n");
    await this.app.workspace.openLinkText("", "");
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView?.editor) {
      activeView.editor.replaceRange("\n## Compliance Search Results\n\n" + list + "\n", activeView.editor.getCursor());
    }
    new Notice(`Found ${results.length} compliance files`);
  }

  // ─── OpenClaw Gateway Integration ──────────────────────────────────────────
  private async pingGateway() {
    if (!this.settings.openclawEnabled) {
      new Notice("OpenClaw integration disabled in settings");
      return;
    }

    const url = `${this.settings.gatewayUrl}/health`;
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          ...(this.settings.gatewayToken
            ? { Authorization: `Bearer ${this.settings.gatewayToken}` }
            : {}),
        },
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        new Notice("Gateway is live ✓");
        this.statusBarItem.setText(`VVU | OpenClaw: LIVE`);
        this.statusBarItem.addClass("vvu-status-live");
      } else {
        new Notice(`Gateway responded ${res.status}`);
        this.statusBarItem.setText(`VVU | OpenClaw: ${res.status}`);
        this.statusBarItem.removeClass("vvu-status-live");
      }
    } catch (e) {
      new Notice(`Gateway unreachable: ${(e as Error).message}`);
      this.statusBarItem.setText(`VVU | OpenClaw: DOWN`);
      this.statusBarItem.removeClass("vvu-status-live");
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────
  private async ensureFolder(path: string) {
    const folder = this.app.vault.getAbstractFileByPath(path);
    if (!folder) {
      await this.app.vault.createFolder(path);
    }
  }

  private updateStatusBar() {
    this.statusBarItem.setText(
      `VVU | ${this.settings.openclawEnabled ? "OpenClaw: ON" : "OpenClaw: OFF"}`
    );
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.updateStatusBar();
  }
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
class VvuWarRoomSettingTab extends PluginSettingTab {
  plugin: VvuWarRoomPlugin;

  constructor(app: App, plugin: VvuWarRoomPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "VVU War Room Settings" });

    new Setting(containerEl)
      .setName("Daily notes folder")
      .setDesc("Folder where daily notes are created.")
      .addText((text) =>
        text
          .setPlaceholder("daily")
          .setValue(this.plugin.settings.dailyNoteFolder)
          .onChange(async (value) => {
            this.plugin.settings.dailyNoteFolder = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Compliance folder")
      .setDesc("Root folder for compliance documents.")
      .addText((text) =>
        text
          .setPlaceholder("compliance")
          .setValue(this.plugin.settings.complianceFolder)
          .onChange(async (value) => {
            this.plugin.settings.complianceFolder = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("OpenClaw gateway URL")
      .setDesc("Base URL of the running OpenClaw gateway.")
      .addText((text) =>
        text
          .setPlaceholder("http://127.0.0.1:18789")
          .setValue(this.plugin.settings.gatewayUrl)
          .onChange(async (value) => {
            this.plugin.settings.gatewayUrl = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Gateway token")
      .setDesc("Optional bearer token for gateway auth.")
      .addText((text) =>
        text
          .setPlaceholder("vvu-war-room-2026-local")
          .setValue(this.plugin.settings.gatewayToken)
          .onChange(async (value) => {
            this.plugin.settings.gatewayToken = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Enable OpenClaw integration")
      .setDesc("Allow the plugin to send events to the gateway.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.openclawEnabled)
          .onChange(async (value) => {
            this.plugin.settings.openclawEnabled = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
