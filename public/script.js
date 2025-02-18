const socket = io();

    let links = [];
    let currentEditingId = null;
    let isAscending = true;

    socket.on('links', (data) => {
        links = data;
        renderCards();
    });

    function renderCards() {
        const cardsContainer = document.getElementById('cardsContainer');
        cardsContainer.innerHTML = '';
        const filteredLinks = links.filter(link => link.visible !== false);
        const sortedLinks = filteredLinks.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            const dateComparison = new Date(b.date) - new Date(a.date);
            return isAscending ? -dateComparison : dateComparison;
        });
        sortedLinks.forEach(link => {
            const card = document.createElement('div');
            card.className = `card ${link.pinned ? 'pinned' : ''}`;
            card.innerHTML = `
                <div class="card-checkbox"><input type="checkbox" id="select-${link.id}" onclick="toggleSelection('${link.id}')"></div>
                <div class="card-title">${link.title}</div>
                <div class="card-description">${link.description}</div>
                <div class="card-date">${new Date(link.date).toLocaleString()}</div>
                <div class="card-tags">${link.tags.map(tag => `<span>${tag}</span>`).join(' ')}</div>
                <div class="card-actions">
                    <button class="copy-url" onclick="copyUrl('${link.url}')">Copy URL</button>
                    <button onclick="editLink('${link.id}')">Edit</button>
                    <button class="delete" onclick="confirmDelete('${link.id}')">Delete</button>
                </div>
            `;
            cardsContainer.appendChild(card);
        });
    }

    function openModal(id) {
        if (id) {
            currentEditingId = id;
            const link = links.find(link => link.id === id);
            document.getElementById('linkTitle').value = link.title;
            document.getElementById('linkUrl').value = link.url;
            document.getElementById('linkDescription').value = link.description;
            document.getElementById('linkTags').value = link.tags.join(', ');
            document.getElementById('linkPinned').checked = link.pinned;
        } else {
            currentEditingId = null;
            document.getElementById('linkForm').reset();
        }
        document.getElementById('myModal').style.display = "block";
    }

    function closeModal() {
        document.getElementById('myModal').style.display = "none";
    }

    document.getElementById('linkForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const title = document.getElementById('linkTitle').value;
        const url = document.getElementById('linkUrl').value;
        const description = document.getElementById('linkDescription').value;
        const tags = document.getElementById('linkTags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
        const pinned = document.getElementById('linkPinned').checked;
        const date = new Date();

        if (currentEditingId) {
            const updatedLink = { id: currentEditingId, title, url, description, tags, pinned, date };
            socket.emit('updateLink', updatedLink);
        } else {
            const newLink = { id: Date.now().toString(), title, url, description, tags, pinned, date };
            socket.emit('addLink', newLink);
        }

        closeModal();
    });

    function editLink(id) {
        openModal(id);
    }

    function confirmDelete(id) {
        if (confirm('Are you sure you want to delete this link?')) {
            deleteLink(id);
        }
    }

    function deleteLink(id) {
        socket.emit('deleteLink', id);
    }

    function toggleSelection(id) {
        const link = links.find(link => link.id === id);
        if (link) {
            link.selected = !link.selected;
        }
    }

    function deleteSelectedLinks() {
        if (confirm('Are you sure you want to delete the selected links?')) {
            links.forEach(link => {
                if (link.selected) {
                    socket.emit('deleteLink', link.id);
                }
            });
        }
    }

    document.getElementById('searchBar').addEventListener('input', function() {
        const query = this.value.toLowerCase();
        links.forEach(link => {
            link.visible = link.tags.some(tag => tag.toLowerCase().includes(query)) || link.title.toLowerCase().includes(query);
        });
        renderCards();
    });

    function toggleSortOrder() {
        isAscending = !isAscending;
        renderCards();
    }

    function copyUrl(url) {
        navigator.clipboard.writeText(url).then(() => {
            alert('URL copied to clipboard!');
        }).catch(err => {
            console.error('Could not copy text: ', err);
        });
    }