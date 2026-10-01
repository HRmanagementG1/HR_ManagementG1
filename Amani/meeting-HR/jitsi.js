
function openJitsiMeeting(meetingLink) {

    if (!meetingLink) {

        alert("Meeting link not found.");

        return;
    }


    window.open(
        meetingLink,
        "_blank"
    );
}