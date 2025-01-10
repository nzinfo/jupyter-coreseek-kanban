import { Widget } from '@lumino/widgets';
import { Signal } from '@lumino/signaling';
import { searchIcon } from '@jupyterlab/ui-components';

interface Assignee {
  name: string;
  profile?: string;
}

export class AssigneeSelector extends Widget {
  constructor() {
    super();
    this.addClass('jp-AssigneeSelector');

    // Create current display
    this._currentContainer = document.createElement('div');
    this._currentContainer.className = 'jp-AssigneeSelector-current';
    this._currentContainer.addEventListener('click', this._handleToggleDropdown);
    this.node.appendChild(this._currentContainer);

    // Create dropdown
    this._dropdownContainer = document.createElement('div');
    this._dropdownContainer.className = 'jp-AssigneeSelector-dropdown';
    this._dropdownContainer.style.display = 'none';

    // Create search wrapper
    const searchWrapper = document.createElement('div');
    searchWrapper.className = 'jp-AssigneeSelector-search-wrapper';

    const searchIconElement = searchIcon.element({
      tag: 'span',
      className: 'jp-AssigneeSelector-searchIcon'
    });
    searchWrapper.appendChild(searchIconElement);

    this._searchInput = document.createElement('input');
    this._searchInput.className = 'jp-AssigneeSelector-search';
    this._searchInput.type = 'text';
    this._searchInput.placeholder = 'Search assignees...';
    this._searchInput.spellcheck = false;
    this._searchInput.addEventListener('input', this._handleSearch);
    this._searchInput.addEventListener('keydown', this._handleKeyDown);
    searchWrapper.appendChild(this._searchInput);

    this._dropdownContainer.appendChild(searchWrapper);

    // Create list container
    this._listContainer = document.createElement('div');
    this._listContainer.className = 'jp-AssigneeSelector-list';
    this._dropdownContainer.appendChild(this._listContainer);

    // Add dropdown to body
    document.body.appendChild(this._dropdownContainer);

    // Add click outside listener
    document.addEventListener('mousedown', this._handleClickOutside);
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    document.removeEventListener('mousedown', this._handleClickOutside);
    if (this._dropdownContainer && this._dropdownContainer.parentNode) {
      this._dropdownContainer.parentNode.removeChild(this._dropdownContainer);
    }
    super.dispose();
  }

  get assigneeChanged(): Signal<this, Assignee> {
    return this._assigneeChanged;
  }

  setAssignees(assignees: Assignee[]): void {
    this._assignees = assignees;
    this._renderList();
  }

  setCurrentAssignee(assignee?: Assignee): void {
    this._currentAssignee = assignee;
    this._renderCurrent();
  }

  private _renderCurrent(): void {
    this._currentContainer.innerHTML = '';

    const avatar = document.createElement('div');
    avatar.className = 'jp-TaskCard-avatar';

    if (this._currentAssignee) {
      avatar.title = this._currentAssignee.name;
      if (this._currentAssignee.profile) {
        const img = document.createElement('img');
        img.src = this._currentAssignee.profile;
        img.alt = this._currentAssignee.name;
        avatar.appendChild(img);
      } else {
        avatar.textContent = this._currentAssignee.name.charAt(0).toUpperCase();
      }
    } else {
      avatar.className += ' jp-TaskCard-avatar-empty';
      avatar.textContent = '?';
    }

    this._currentContainer.appendChild(avatar);
  }

  private _renderList(): void {
    this._listContainer.innerHTML = '';

    const assignees = this._searchTerm
      ? this._assignees.filter(a => 
          a.name.toLowerCase().includes(this._searchTerm.toLowerCase())
        )
      : this._assignees;

    assignees.forEach(assignee => {
      const item = document.createElement('div');
      item.className = 'jp-AssigneeSelector-item';
      if (this._currentAssignee?.name === assignee.name) {
        item.classList.add('jp-mod-selected');
      }

      const avatar = document.createElement('div');
      avatar.className = 'jp-TaskCard-avatar';
      if (assignee.profile) {
        const img = document.createElement('img');
        img.src = assignee.profile;
        img.alt = assignee.name;
        avatar.appendChild(img);
      } else {
        avatar.textContent = assignee.name.charAt(0).toUpperCase();
      }

      const name = document.createElement('span');
      name.className = 'jp-AssigneeSelector-name';
      name.textContent = assignee.name;

      item.appendChild(avatar);
      item.appendChild(name);

      item.addEventListener('click', () => this._handleAssigneeSelect(assignee));

      this._listContainer.appendChild(item);
    });
  }

  private _handleSearch = (event: Event): void => {
    this._searchTerm = (event.target as HTMLInputElement).value;
    this._renderList();
  };

  private _handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      this._hideDropdown();
    }
  };

  private _handleToggleDropdown = (): void => {
    if (this._dropdownContainer.style.display === 'none') {
      this._showDropdown();
    } else {
      this._hideDropdown();
    }
  };

  private _showDropdown(): void {
    // Position dropdown relative to current display
    const rect = this._currentContainer.getBoundingClientRect();
    this._dropdownContainer.style.position = 'fixed';
    this._dropdownContainer.style.top = `${rect.bottom}px`;
    this._dropdownContainer.style.left = `${rect.left}px`;
    this._dropdownContainer.style.display = 'block';
    this._searchInput.value = '';
    this._searchTerm = '';
    this._renderList();
    this._searchInput.focus();
  }

  private _hideDropdown(): void {
    this._dropdownContainer.style.display = 'none';
  }

  private _handleAssigneeSelect(assignee: Assignee): void {
    this._currentAssignee = assignee;
    this._renderCurrent();
    this._hideDropdown();
    this._assigneeChanged.emit(assignee);
  }

  private _handleClickOutside = (event: MouseEvent): void => {
    if (!this.node.contains(event.target as Node) && !this._dropdownContainer.contains(event.target as Node)) {
      this._hideDropdown();
    }
  };

  private _assignees: Assignee[] = [];
  private _currentAssignee?: Assignee;
  private _searchTerm = '';
  private _dropdownContainer: HTMLElement;
  private _currentContainer: HTMLElement;
  private _searchInput: HTMLInputElement;
  private _listContainer: HTMLElement;
  private _assigneeChanged = new Signal<this, Assignee>(this);
}
