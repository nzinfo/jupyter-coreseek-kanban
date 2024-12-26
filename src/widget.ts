import { Widget } from '@lumino/widgets';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { DocumentWidget } from '@jupyterlab/docregistry';
import { CodeMirrorEditor, CodeMirrorEditorFactory } from '@jupyterlab/codemirror';
import { CodeEditor } from '@jupyterlab/codeeditor';
import { YFile } from '@jupyter/ydoc';

export class KanbanWidget extends Widget {
  readonly model: CodeEditor.IModel;
  readonly editor: CodeMirrorEditor;
  private container: HTMLDivElement;

  constructor() {
    super();
    this.addClass('jp-KanbanWidget');

    // Create container for the widget
    this.container = document.createElement('div');
    this.container.className = 'jp-KanbanWidget-container';
    this.node.appendChild(this.container);

    // Create header section
    const header = document.createElement('div');
    header.className = 'jp-KanbanWidget-header';
    header.innerHTML = '<h2>Kanban Board</h2>';
    this.container.appendChild(header);

    // Create editor section
    const editorSection = document.createElement('div');
    editorSection.className = 'jp-KanbanWidget-editor';
    this.container.appendChild(editorSection);
    
    // Create editor factory
    const factory = new CodeMirrorEditorFactory();
    
    // Create editor model with shared model for collaboration
    this.model = new CodeEditor.Model({
      sharedModel: new YFile()
    });
    
    // Create editor with inline configuration
    this.editor = factory.newInlineEditor({
      host: editorSection,
      model: this.model,
      config: {
        lineNumbers: true,
        lineWrap: true,
        styleActiveLine: true,
        matchBrackets: true,
        autoClosingBrackets: true,
        readOnly: false
      }
    }) as CodeMirrorEditor;

    // Set initial content
    this.model.sharedModel.setSource('# Kanban Board Title\n\nEdit this title...');

    // If collaborative editing is available (sharedModel exists), set up collaboration features
    const sharedModel = this.model.sharedModel;
    if (sharedModel) {
      this.setupCollaboration(sharedModel);
    }

    // Add some basic styles
    const style = document.createElement('style');
    style.textContent = `
      .jp-KanbanWidget-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        padding: 16px;
      }
      .jp-KanbanWidget-header {
        margin-bottom: 16px;
      }
      .jp-KanbanWidget-editor {
        flex: 1;
        border: 1px solid var(--jp-border-color1);
        border-radius: 4px;
        padding: 8px;
      }
    `;
    document.head.appendChild(style);
  }

  private setupCollaboration(sharedModel: any) {
    // Listen for shared model changes
    sharedModel.changed.connect(() => {
      const newContent = sharedModel.getSource();
      if (this.content !== newContent) {
        this.content = newContent;
      }
    });
  }

  get content(): string {
    return this.model.sharedModel.getSource();
  }

  set content(value: string) {
    this.model.sharedModel.setSource(value);
  }
}

export class KanbanDocWidget extends DocumentWidget<KanbanWidget, DocumentRegistry.ICodeModel> {
  constructor(options: DocumentWidget.IOptions<KanbanWidget, DocumentRegistry.ICodeModel>) {
    super(options);
    
    // Sync document content with widget
    this.context.ready.then(() => {
      // Initial sync
      this.content.content = this.context.model.toString();
      
      // Listen for model changes
      this.context.model.contentChanged.connect(() => {
        const newContent = this.context.model.toString();
        if (this.content.content !== newContent) {
          this.content.content = newContent;
        }
      });

      // Listen for editor changes
      const sharedModel = this.content.model.sharedModel;
      if (sharedModel) {
        sharedModel.changed.connect(() => {
          const newContent = sharedModel.getSource();
          if (this.context.model.toString() !== newContent) {
            this.context.model.fromString(newContent);
          }
        });
      }
    });
  }
}
