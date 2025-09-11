# Backend WS protocol notes

This frontend now sends a message when a user leaves a room.

Message sent by client when leaving a room
- type: "room:leave"
- payload: { code: string }

Example
{
  "type": "room:leave",
  "code": "ABCD12"
}

Expected backend behavior (minimal)
- Remove the user from the room with the given code.
- Broadcast updated room:state (including users) to remaining participants, and optionally to the leaving client.
- Optionally acknowledge via either:
  - room:state with room set to { state: "lobby" } for the leaving client, or
  - a specific room:left acknowledgement.

Client behavior
- Immediately dispatches ws message above and resets local room state, then navigates back to the lobby view. If the server later sends room:state reflecting lobby/no room, it is also handled.
