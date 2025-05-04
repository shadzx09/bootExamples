// scripts.js

document.addEventListener('DOMContentLoaded', () => {
    // Elements for index.html
    const searchForm = document.getElementById('search-form');
    const searchResults = document.getElementById('search-results');
  
    // Elements for bus-details.html
    const busDetailsDiv = document.getElementById('bus-details');
    const bookNowBtn = document.getElementById('book-now-btn');
  
    // Elements for ticket-form.html
    const ticketForm = document.getElementById('ticket-form');
    const passengerTypeSelect = document.getElementById('passenger-type');
    const idUploadContainer = document.getElementById('id-upload-container');
    const seatNumberInput = document.getElementById('seat-number');
    const selectSeatBtn = document.getElementById('select-seat-btn');
    const seatModal = document.getElementById('seat-modal');
    const closeSeatModalBtn = document.getElementById('close-seat-modal');
    const seatMapDiv = document.getElementById('seat-map');
  
    // Elements for ticket-confirmation.html
    const ticketDetailsDiv = document.getElementById('ticket-details');
    const confirmBookingBtn = document.getElementById('confirm-booking-btn');
  
    // Elements for profile.html
    const profileForm = document.getElementById('profile-form');
    const bookingHistoryDiv = document.getElementById('booking-history');
  
    // Utility to get query params
    function getQueryParam(param) {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get(param);
    }
  
    // ----------------- index.html logic -----------------
    if (searchForm) {
      searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const location = e.target.location.value.trim();
        const destination = e.target.destination.value.trim();
        const date = e.target.date.value;
  
        if (!location || !destination || !date) {
          alert('Please fill all search fields.');
          return;
        }
  
        try {
          const response = await fetch('search_buses.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ location, destination, date }),
          });
          const data = await response.json();
          if (data.success) {
            displaySearchResults(data.buses);
          } else {
            searchResults.innerHTML = '<p>No buses found.</p>';
          }
        } catch (error) {
          console.error(error);
          searchResults.innerHTML = '<p>Error searching buses.</p>';
        }
      });
  
      function displaySearchResults(buses) {
        if (!buses.length) {
          searchResults.innerHTML = '<p>No buses found.</p>';
          return;
        }
        searchResults.innerHTML = '';
        buses.forEach((bus) => {
          const div = document.createElement('div');
          div.className = 'bus-item';
          div.textContent = `Bus ${bus.bus_number} - ${bus.location} to ${bus.destination} - ${bus.bus_type} - ${bus.date} ${bus.time} - Seats: ${bus.available_seats} - Price: $${bus.price}`;
          div.addEventListener('click', () => {
            window.location.href = `bus_details.html?bus_id=${bus.bus_id}`;
          });
          searchResults.appendChild(div);
        });
      }
    }
  
    // ----------------- bus-details.html logic -----------------
    if (busDetailsDiv && bookNowBtn) {
      const busId = getQueryParam('bus_id');
      if (!busId) {
        busDetailsDiv.innerHTML = '<p>Bus ID not specified.</p>';
      } else {
        fetchBusDetails(busId);
      }
  
      async function fetchBusDetails(busId) {
        try {
          const response = await fetch(`get_bus_details.php?bus_id=${busId}`);
          const data = await response.json();
          if (data.success) {
            displayBusDetails(data.bus);
          } else {
            busDetailsDiv.innerHTML = '<p>Bus not found.</p>';
          }
        } catch (error) {
          console.error(error);
          busDetailsDiv.innerHTML = '<p>Error fetching bus details.</p>';
        }
      }
  
      function displayBusDetails(bus) {
        busDetailsDiv.innerHTML = `
          <p><strong>Bus Number:</strong> ${bus.bus_number}</p>
          <p><strong>Location:</strong> ${bus.location}</p>
          <p><strong>Destination:</strong> ${bus.destination}</p>
          <p><strong>Bus Type:</strong> ${bus.bus_type}</p>
          <p><strong>Date:</strong> ${bus.date}</p>
          <p><strong>Time:</strong> ${bus.time}</p>
          <p><strong>Available Seats:</strong> ${bus.available_seats}</p>
          <p><strong>Price:</strong> $${bus.price}</p>
        `;
        bookNowBtn.onclick = () => {
          window.location.href = `ticket_form.html?bus_id=${bus.bus_id}`;
        };
      }
    }
  
    // ----------------- ticket-form.html logic -----------------
    if (ticketForm) {
      const busId = getQueryParam('bus_id');
      if (!busId) {
        alert('Bus ID not specified.');
        window.location.href = 'index.html';
      }
  
      if (passengerTypeSelect) {
        passengerTypeSelect.addEventListener('change', () => {
          const val = passengerTypeSelect.value;
          idUploadContainer.style.display = (val === 'PWD/Senior Citizen' || val === 'Student') ? 'block' : 'none';
        });
      }
  
      if (selectSeatBtn && seatModal && seatMapDiv && seatNumberInput) {
        selectSeatBtn.addEventListener('click', () => {
          seatModal.style.display = 'block';
          loadSeatMap();
        });
  
        closeSeatModalBtn.addEventListener('click', () => {
          seatModal.style.display = 'none';
        });
  
        window.addEventListener('click', (event) => {
          if (event.target === seatModal) {
            seatModal.style.display = 'none';
          }
        });
  
        async function loadSeatMap() {
          seatMapDiv.innerHTML = '';
          try {
            const response = await fetch(`get_bus_details.php?bus_id=${busId}`);
            const data = await response.json();
            if (data.success) {
              const bus = data.bus;
              const occupiedSeats = bus.occupied_seats || [];
              for (let i = 1; i <= 30; i++) {
                const seat = document.createElement('div');
                seat.className = 'seat';
                seat.textContent = i;
                if (occupiedSeats.includes(i)) {
                  seat.classList.add('occupied');
                }
                seat.addEventListener('click', () => {
                  if (!seat.classList.contains('occupied')) {
                    const selected = seatMapDiv.querySelector('.selected');
                    if (selected) selected.classList.remove('selected');
                    seat.classList.add('selected');
                    seatNumberInput.value = i;
                    seatModal.style.display = 'none';
                  }
                });
                seatMapDiv.appendChild(seat);
              }
            } else {
              seatMapDiv.innerHTML = '<p>Error loading seats.</p>';
            }
          } catch (error) {
            console.error(error);
            seatMapDiv.innerHTML = '<p>Error loading seats.</p>';
          }
        }
      }
  
      ticketForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!seatNumberInput.value) {
          alert('Please select a seat.');
          return;
        }
        const formData = new FormData(ticketForm);
        formData.append('bus_id', busId);
  
        try {
          const response = await fetch('book_ticket.php', {
            method: 'POST',
            body: formData,
          });
          const data = await response.json();
          if (data.success) {
            window.location.href = `ticket_confirmation.html?reference=${data.reference}`;
          } else {
            alert('Booking failed: ' + data.message);
          }
        } catch (error) {
          console.error(error);
          alert('Error submitting booking.');
        }
      });
    }
  
    // ----------------- ticket-confirmation.html logic -----------------
    if (ticketDetailsDiv && confirmBookingBtn) {
      const reference = getQueryParam('reference');
      if (!reference) {
        ticketDetailsDiv.innerHTML = '<p>Booking reference not specified.</p>';
      } else {
        fetchBookingDetails(reference);
      }
  
      async function fetchBookingDetails(reference) {
        try {
          const response = await fetch(`get_booking_details.php?reference=${reference}`);
          const data = await response.json();
          if (data.success) {
            displayTicketDetails(data.booking);
          } else {
            ticketDetailsDiv.innerHTML = '<p>Booking not found.</p>';
          }
        } catch (error) {
          console.error(error);
          ticketDetailsDiv.innerHTML = '<p>Error fetching booking details.</p>';
        }
      }
  
      function displayTicketDetails(booking) {
        ticketDetailsDiv.innerHTML = `
          <p><strong>Bus Number:</strong> ${booking.bus_number}</p>
          <p><strong>Location:</strong> ${booking.location}</p>
          <p><strong>Destination:</strong> ${booking.destination}</p>
          <p><strong>Date:</strong> ${booking.date}</p>
          <p><strong>Time:</strong> ${booking.time}</p>
          <p><strong>Bus Type:</strong> ${booking.bus_type}</p>
          <p><strong>Passenger Type:</strong> ${booking.passenger_type}</p>
          <p><strong>Seat Number:</strong> ${booking.seat_number}</p>
          <p><strong>Price:</strong> $${booking.price}</p>
          <p><strong>Reference Number:</strong> ${booking.reference}</p>
        `;
      }
  
      confirmBookingBtn.addEventListener('click', async () => {
        try {
          const response = await fetch('confirm_booking.php', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ reference }),
          });
          const data = await response.json();
          if (data.success) {
            alert('Booking confirmed! Reference number: ' + reference);
            window.location.href = 'profile.html';
          } else {
            alert('Booking confirmation failed: ' + (data.message || 'Unknown error'));
          }
        } catch (error) {
          console.error(error);
          alert('Error confirming booking.');
        }
      });
    }
  
    // ----------------- profile.html logic -----------------
    if (profileForm && bookingHistoryDiv) {
      loadProfile();
  
      profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(profileForm);
        try {
          const response = await fetch('update_profile.php', {
            method: 'POST',
            body: formData,
          });
          const data = await response.json();
          if (data.success) {
            alert('Profile updated successfully.');
            loadProfile();
          } else {
            alert('Profile update failed.');
          }
        } catch (error) {
          console.error(error);
          alert('Error updating profile.');
        }
      });
  
      async function loadProfile() {
        try {
          const response = await fetch('get_profile.php');
          const data = await response.json();
          if (data.success) {
            const user = data.user;
            document.getElementById('profile-name').value = user.name || '';
            document.getElementById('profile-email').value = user.email || '';
            document.getElementById('profile-phone').value = user.phone || '';
            displayBookingHistory(data.bookings);
          } else {
            bookingHistoryDiv.innerHTML = '<p>Error loading profile.</p>';
          }
        } catch (error) {
          console.error(error);
          bookingHistoryDiv.innerHTML = '<p>Error loading profile.</p>';
        }
      }
  
      function displayBookingHistory(bookings) {
        if (!bookings.length) {
          bookingHistoryDiv.innerHTML = '<p>No booking history.</p>';
          return;
        }
        bookingHistoryDiv.innerHTML = '';
        bookings.forEach((booking) => {
          const div = document.createElement('div');
          div.className = 'booking-item';
          div.innerHTML = `
            <p><strong>Reference:</strong> ${booking.reference}</p>
            <p><strong>Bus:</strong> ${booking.bus_number} (${booking.location} to ${booking.destination})</p>
            <p><strong>Date:</strong> ${booking.date}</p>
            <p><strong>Status:</strong> ${booking.status}</p>
          `;
          bookingHistoryDiv.appendChild(div);
        });
      }
    }
  });
  