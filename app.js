const options = {
  enableHighAccuracy: true, // Get high accuracy reading, if available (default false)
  timeout: 5000, // Time to return a position successfully before error (default infinity)
  maximumAge: 2000, // Milliseconds for which it is acceptable to use cached position (default 0)
};

// JavaScript code
//used as reference https://www.youtube.com/watch?v=YhvLnd0ylds
//fix loco
navigator.geolocation.getCurrentPosition(success, error, options);

function success(pos) {
  const lat = pos.coords.latitude;
  const lng = pos.coords.longitude;
  const markup = `
      <a href="https://openstreetmap.org/#map=16/${lat}/${lng}">
        Your current latitude: ${lat}, longitude: ${lng}.
      </a>
    `;
  document.getElementById(`output`).innerHTML = markup;
}

function error(err) {
  if (err.code === 1) {
    //user issue
    alert("Please allow access to your location");
  } else {
    //server issue
    alert("Cannot get current location");
  }
}
class LFGSystem {
  constructor() {
    // Retrieve groups from localStorage on initialization
    this.groups = JSON.parse(localStorage.getItem("lfg_groups")) || [];
  }

  create_group(groupData) {
    this.groups.push(groupData);
    // Save updated groups to localStorage
    localStorage.setItem("lfg_groups", JSON.stringify(this.groups));
  }

  list_groups() {
    return this.groups;
  }
}
const messageContainer = document.getElementById("message-container");
const groupForm = document.getElementById("group-form");
const lfgSystem = new LFGSystem();

groupForm.addEventListener("submit", function (event) {
  event.preventDefault();
  createGroup();
});

function appendMessage(message) {
  const p = document.createElement("p");
  p.textContent = message;
  messageContainer.appendChild(p);
}

function createGroup() {
  const groupName = document.getElementById("group-name").value;
  const maxPlayers = parseInt(document.getElementById("max-players").value);
  const description = document.getElementById("description").value;
  const tags = document
    .getElementById("tags")
    .value.split(",")
    .map((tag) => tag.trim());

  if (groupName.trim() === "") {
    appendMessage("Please enter a group name.");
    return;
  }

  if (maxPlayers < 1) {
    appendMessage("Max Players must be greater than 0.");
    return;
  }

  const groupData = {
    group_name: groupName,
    max_players: maxPlayers, // Fix the property name here
    description: description,
    tags: tags,
  };

  // Send a POST request to the server
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "http://localhost:5501/createGroup", true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onload = function () {
    if (xhr.status === 200) {
      appendMessage(`Group "${groupName}" created successfully.`);
    } else {
      appendMessage("Failed to create group. Please try again.");
    }
  };
  xhr.send(JSON.stringify(groupData));
}

function listGroups() {
  messageContainer.innerHTML = "";

  // Send a GET request to the server to fetch the list of groups
  const xhr = new XMLHttpRequest();
  xhr.open("GET", "http://localhost:5501/listGroups", true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onload = function () {
    if (xhr.status === 200) {
      const groups = JSON.parse(xhr.responseText);
      for (const group of groups) {
        const tags = group.tags
          .split(",")
          .map((tag) => tag.trim())
          .join(", ");
        appendMessage(`
  Group Name: ${group.group_name}
  Max Players: ${group.max_players}
  Description: ${group.description}
  Tags: ${tags}
`);
      }
    } else {
      appendMessage("Failed to fetch groups. Please try again.");
    }
  };
  xhr.send();
}
