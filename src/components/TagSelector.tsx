import { Widget } from '@lumino/widgets';
import { Signal } from '@lumino/signaling';
import { addIcon, checkIcon, searchIcon } from '@jupyterlab/ui-components';

interface Tag {
  name: string;
}

export class TagSelector extends Widget {
  constructor() {
    super();
    this.addClass('jp-TagSelector');

    // Create current display
    this._currentDisplay = document.createElement('div');
    this._currentDisplay.className = 'jp-TagSelector-current';
    const addIconElement = addIcon.element({
      tag: 'span',
      className: 'jp-TagSelector-addIcon'
    });
    this._currentDisplay.appendChild(addIconElement);
    this._currentDisplay.addEventListener('click', this._toggleDropdown);
    this.node.appendChild(this._currentDisplay);

    // Create dropdown
    this._dropdown = document.createElement('div');
    this._dropdown.className = 'jp-TagSelector-dropdown';
    this._dropdown.style.display = 'none';

    // Create search wrapper
    const searchWrapper = document.createElement('div');
    searchWrapper.className = 'jp-TagSelector-search-wrapper';
    
    const searchIconElement = searchIcon.element({
      tag: 'span',
      className: 'jp-TagSelector-searchIcon'
    });
    searchWrapper.appendChild(searchIconElement);

    this._searchInput = document.createElement('input');
    this._searchInput.className = 'jp-TagSelector-search';
    this._searchInput.type = 'text';
    this._searchInput.placeholder = 'Search or create tag...';
    this._searchInput.addEventListener('input', this._handleSearch);
    this._searchInput.addEventListener('keydown', this._handleKeyDown);
    searchWrapper.appendChild(this._searchInput);
    
    this._dropdown.appendChild(searchWrapper);

    // Create tag list
    this._listContainer = document.createElement('div');
    this._listContainer.className = 'jp-TagSelector-list';
    this._dropdown.appendChild(this._listContainer);

    // Add dropdown to body
    document.body.appendChild(this._dropdown);

    // Add click outside listener
    document.addEventListener('click', this._handleClickOutside);
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    document.removeEventListener('click', this._handleClickOutside);
    if (this._dropdown && this._dropdown.parentNode) {
      this._dropdown.parentNode.removeChild(this._dropdown);
    }
    super.dispose();
  }

  get tagToggled(): Signal<this, Tag> {
    return this._tagToggled;
  }

  setAvailableTags(tags: Tag[]): void {
    this._availableTags = tags;
    this._renderList();
  }

  setSelectedTags(tags: Tag[]): void {
    this._selectedTags = tags;
    this._renderList();
  }

  private _toggleDropdown = (event: MouseEvent): void => {
    event.stopPropagation();
    if (this._dropdown.style.display === 'none') {
      this._showDropdown();
    } else {
      this._hideDropdown();
    }
  };

  private _showDropdown(): void {
    // Position dropdown relative to current display
    const rect = this._currentDisplay.getBoundingClientRect();
    this._dropdown.style.position = 'fixed';
    this._dropdown.style.top = `${rect.bottom}px`;
    this._dropdown.style.left = `${rect.left}px`;
    this._dropdown.style.display = 'block';
    this._searchInput.focus();
  }

  private _hideDropdown(): void {
    this._dropdown.style.display = 'none';
    this._searchInput.value = '';
    this._renderList();
  }

  private _renderList(): void {
    this._listContainer.innerHTML = '';
    
    const searchTerm = this._searchTerm.toLowerCase();
    const filteredTags = searchTerm
      ? this._availableTags.filter(t => 
          t.name.toLowerCase().includes(searchTerm)
        )
      : this._availableTags;
    
    // If no exact match found and search term is not empty, show create option
    if (searchTerm && !this._availableTags.some(t => 
        t.name.toLowerCase() === searchTerm.toLowerCase())) {
      const createItem = document.createElement('div');
      createItem.className = 'jp-TagSelector-item jp-TagSelector-createItem';
      createItem.textContent = `Create new tag "${this._searchTerm}"`;
      createItem.addEventListener('click', () => this._handleTagSelect({ name: this._searchTerm }));
      this._listContainer.appendChild(createItem);
    }
    
    filteredTags.forEach(tag => {
      const item = document.createElement('div');
      item.className = 'jp-TagSelector-item';
      
      const name = document.createElement('span');
      name.className = 'jp-TagSelector-name';
      name.textContent = tag.name;
      
      // Add check icon for selected tags
      if (this._selectedTags.some(t => t.name === tag.name)) {
        item.classList.add('jp-mod-selected');
        const checkIconElement = checkIcon.element({
          tag: 'span',
          className: 'jp-TagSelector-checkIcon'
        });
        item.appendChild(checkIconElement);
      }
      
      item.appendChild(name);
      item.addEventListener('click', () => this._handleTagSelect(tag));
      
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
    } else if (event.key === 'Enter' && this._searchTerm) {
      // Create and select new tag if it doesn't exist
      const newTag = { name: this._searchTerm };
      if (!this._availableTags.some(t => t.name.toLowerCase() === this._searchTerm.toLowerCase())) {
        this._availableTags.push(newTag);
      }
      this._handleTagSelect(newTag);
      this._hideDropdown();
    }
  };

  private _handleTagSelect(tag: Tag): void {
    const isSelected = this._selectedTags.some(t => t.name === tag.name);
    if (isSelected) {
      // Remove tag if already selected
      this._selectedTags = this._selectedTags.filter(t => t.name !== tag.name);
    } else {
      // Add tag if not selected
      this._selectedTags.push(tag);
    }
    this._renderList();
    this._tagToggled.emit(tag);
  }

  private _handleClickOutside = (event: MouseEvent): void => {
    if (!this.node.contains(event.target as Node) && !this._dropdown.contains(event.target as Node)) {
      this._hideDropdown();
    }
  };

  private _availableTags: Tag[] = [];
  private _selectedTags: Tag[] = [];
  private _searchTerm = '';
  private _dropdown: HTMLElement;
  private _currentDisplay: HTMLElement;
  private _searchInput: HTMLInputElement;
  private _listContainer: HTMLElement;
  private _tagToggled = new Signal<this, Tag>(this);
}
