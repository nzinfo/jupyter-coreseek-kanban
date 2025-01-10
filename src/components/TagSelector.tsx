import { Widget } from '@lumino/widgets';
import { Signal } from '@lumino/signaling';
import { searchIcon, checkIcon } from '@jupyterlab/ui-components';

interface Tag {
  name: string;
}

export class TagSelector extends Widget {
  constructor() {
    super();
    this.addClass('jp-TagSelector');
    
    // Create dropdown container
    this._dropdownContainer = document.createElement('div');
    this._dropdownContainer.className = 'jp-TagSelector-dropdown';
    this._dropdownContainer.style.display = 'none';
    
    // Create search input wrapper
    const searchWrapper = document.createElement('div');
    searchWrapper.className = 'jp-TagSelector-search-wrapper';

    // Add search icon
    const searchIconElement = searchIcon.element({
      tag: 'span',
      className: 'jp-TagSelector-searchIcon'
    });
    searchWrapper.appendChild(searchIconElement);
    
    // Create search input
    this._searchInput = document.createElement('input');
    this._searchInput.className = 'jp-TagSelector-search';
    this._searchInput.type = 'text';
    this._searchInput.placeholder = 'Search or create tag...';
    this._searchInput.spellcheck = false;
    this._searchInput.addEventListener('input', this._handleSearch);
    this._searchInput.addEventListener('keydown', this._handleKeyDown);
    searchWrapper.appendChild(this._searchInput);
    this._dropdownContainer.appendChild(searchWrapper);
    
    // Create list container
    this._listContainer = document.createElement('div');
    this._listContainer.className = 'jp-TagSelector-list';
    this._dropdownContainer.appendChild(this._listContainer);
    
    // Create current tag display (+ button)
    this._currentContainer = document.createElement('div');
    this._currentContainer.className = 'jp-TagSelector-current';
    const addIconElement = document.createElement('span');
    addIconElement.className = 'jp-TagSelector-addIcon';
    addIconElement.textContent = '+';
    this._currentContainer.appendChild(addIconElement);
    this._currentContainer.addEventListener('click', this._handleToggleDropdown);
    
    // Add to DOM
    this.node.appendChild(this._currentContainer);
    this.node.appendChild(this._dropdownContainer);
    
    // Close dropdown when clicking outside
    document.addEventListener('mousedown', this._handleClickOutside);
  }

  dispose(): void {
    document.removeEventListener('mousedown', this._handleClickOutside);
    if (this.isDisposed) {
      return;
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

  private _handleToggleDropdown = (): void => {
    if (this._dropdownContainer.style.display === 'none') {
      this._showDropdown();
    } else {
      this._hideDropdown();
    }
  };

  private _showDropdown(): void {
    this._dropdownContainer.style.display = 'block';
    this._searchInput.value = '';
    this._searchTerm = '';
    this._renderList();
    this._searchInput.focus();
  }

  private _hideDropdown(): void {
    this._dropdownContainer.style.display = 'none';
    this._searchTerm = '';
  }

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
    if (!this.node.contains(event.target as Node)) {
      this._hideDropdown();
    }
  };

  private _availableTags: Tag[] = [];
  private _selectedTags: Tag[] = [];
  private _searchTerm = '';
  private _dropdownContainer: HTMLElement;
  private _currentContainer: HTMLElement;
  private _searchInput: HTMLInputElement;
  private _listContainer: HTMLElement;
  private _tagToggled = new Signal<this, Tag>(this);
}
