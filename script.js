document.addEventListener('DOMContentLoaded', () => {
    const musicalTitleElem = document.querySelector('h1');
    const musicContainer = document.getElementById('music-container');
    const loadingMessage = document.getElementById('loading-message');
    const filePath = 'epic.txt'; // Make sure this path is correct

    // Function to parse the plain text file
    function parseMusicalFile(text) {
        let musical = { title: '', sagas: [] };
        let currentSaga = null;
        let currentSong = null;
        let lyricsBuffer = [];
        let isFirstLine = true; // To capture the musical title

        const lines = text.split('\n');

        lines.forEach(line => {
            const trimmedLine = line.trim();

            if (isFirstLine) {
                musical.title = trimmedLine;
                isFirstLine = false;
                return; // Consume the first line as the musical title
            }

            if (!trimmedLine) {
                // If it's an empty line, it could be a lyric break or a separator.
                // We'll add it to the buffer if a song is active.
                if (currentSong) {
                    lyricsBuffer.push(''); // Preserve blank lines within lyrics
                }
                return; // Skip further processing if just an empty line
            }

            if (trimmedLine.startsWith('**')) {
                // New Saga detected
                // Finalize previous song's lyrics if any
                if (currentSong && lyricsBuffer.length > 0) {
                    currentSong.lyrics = lyricsBuffer.join('\n').trim();
                    lyricsBuffer = [];
                }

                const sagaName = trimmedLine.substring(2).trim();
                currentSaga = { name: sagaName, songs: [] };
                musical.sagas.push(currentSaga);
                currentSong = null; // Reset song context for new saga
            } else if (trimmedLine.startsWith('*')) {
                // New Song detected
                // Finalize previous song's lyrics if any
                if (currentSong && lyricsBuffer.length > 0) {
                    currentSong.lyrics = lyricsBuffer.join('\n').trim();
                    lyricsBuffer = [];
                }

                const songName = trimmedLine.substring(1).trim();
                currentSong = { name: songName, characters: '', lyrics: '' };

                if (currentSaga) {
                    currentSaga.songs.push(currentSong);
                } else {
                    console.warn(`Song "${songName}" found without a preceding saga.`);
                    // Create a default saga if a song appears unexpectedly
                    currentSaga = { name: 'Unnamed Saga', songs: [] };
                    musical.sagas.push(currentSaga);
                    currentSaga.songs.push(currentSong);
                }
            } else if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
                // Characters line detected (should immediately follow a song title)
                if (currentSong) {
                    currentSong.characters = trimmedLine.substring(1, trimmedLine.length - 1).trim();
                } else {
                    console.warn(`Characters line "${trimmedLine}" found without a preceding song.`);
                }
            } else {
                // Lyrics line
                if (currentSong) {
                    lyricsBuffer.push(line); // Use original 'line' to preserve leading spaces for formatting
                } else {
                    console.warn(`Line "${trimmedLine}" treated as stray text (not lyrics) as no song is active.`);
                }
            }
        });

        // After the loop, save lyrics for the very last song if any
        if (currentSong && lyricsBuffer.length > 0) {
            currentSong.lyrics = lyricsBuffer.join('\n').trim();
        }

        return musical;
    }

    // Function to display the parsed data on the webpage
    function displayMusic(musicalData) {
        loadingMessage.style.display = 'none'; // Hide loading message
        musicalTitleElem.textContent = musicalData.title || 'Untitled Musical'; // Set musical title

        if (musicalData.sagas.length === 0) {
            musicContainer.innerHTML = '<p>No musical data found or parsed.</p>';
            return;
        }

        musicalData.sagas.forEach(saga => {
            const sagaDiv = document.createElement('div');
            sagaDiv.classList.add('saga');

            const sagaNameElem = document.createElement('h2');
            sagaNameElem.classList.add('saga-name');
            sagaNameElem.textContent = saga.name;
            sagaDiv.appendChild(sagaNameElem);

            saga.songs.forEach(song => {
                const songDiv = document.createElement('div');
                songDiv.classList.add('song');

                const songNameElem = document.createElement('h3');
                songNameElem.classList.add('song-name');
                songNameElem.textContent = song.name;
                songDiv.appendChild(songNameElem);

                if (song.characters) {
                    const charactersElem = document.createElement('p');
                    charactersElem.classList.add('characters');
                    charactersElem.textContent = `[${song.characters}]`;
                    songDiv.appendChild(charactersElem);
                }

                const lyricsElem = document.createElement('pre'); // Use <pre> to preserve whitespace and line breaks
                lyricsElem.classList.add('lyrics');
                lyricsElem.textContent = song.lyrics;
                songDiv.appendChild(lyricsElem);

                sagaDiv.appendChild(songDiv);
            });

            musicContainer.appendChild(sagaDiv);
        });
    }

    // Fetch the text file and then process it
    fetch(filePath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - Could not load ${filePath}. Make sure it's in the same directory or accessible.`);
            }
            return response.text();
        })
        .then(text => {
            const musicalData = parseMusicalFile(text);
            displayMusic(musicalData);
        })
        .catch(error => {
            console.error('Error fetching or parsing music data:', error);
            loadingMessage.textContent = `Failed to load music data: ${error.message}. Please ensure the file exists and a local server is running if viewing locally.`;
            loadingMessage.style.color = 'red';
        });
});
