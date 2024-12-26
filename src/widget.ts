import { Widget } from '@lumino/widgets';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { DocumentWidget } from '@jupyterlab/docregistry';
import { CodeMirrorEditor, CodeMirrorEditorFactory } from '@jupyterlab/codemirror';
import { CodeEditor } from '@jupyterlab/codeeditor';
import { YFile } from '@jupyter/ydoc';

export class KanbanWidget extends Widget {
  private model: CodeEditor.IModel;
  private editor: CodeMirrorEditor;

  constructor() {
    super();
    this.addClass('jp-KanbanWidget');
    
    // Create editor factory
    const factory = new CodeMirrorEditorFactory();
    
    // Create editor model
    this.model = new CodeEditor.Model({
      sharedModel: new YFile()
    });
    
    // Create editor
    this.editor = factory.newInlineEditor({
      host: this.node,
      model: this.model
    }) as CodeMirrorEditor;

    // If collaborative editing is available (sharedModel exists), set up collaboration features
    const sharedModel = (this.model as any).sharedModel;
    if (sharedModel?.awareness) {
      this.setupCollaboration(sharedModel);
    }
  }

  private setupCollaboration(sharedModel: any) {
    const awareness = sharedModel.awareness;
    
    awareness.on('change', () => {
      const states = awareness.getStates();
      console.log('Collaborator states:', states);
      
      // Update cursor positions
      Object.entries(states).forEach(([clientId, state]: [string, any]) => {
        if (state?.cursor) {
          console.log(`User ${clientId} cursor:`, state.cursor);
        }
      });
    });
  }

  get content(): string {
    return this.model.sharedModel.getSource();
  }

  set content(value: string) {
    this.model.sharedModel.setSource(value);
  }

  getEditor(): CodeMirrorEditor {
    return this.editor;
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
      const editor = this.content.getEditor();
      const sharedModel = (editor.model as any).sharedModel;
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
