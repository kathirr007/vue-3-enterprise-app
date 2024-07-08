<template>
  <div class="layout-rightpanel">
    <div class="rightpanel-wrapper">
      <div class="rightpanel-section weather-section">
        <div class="section-header">
          <h6>Today</h6>
        </div>
        <div class="weather">
          <img src="/demo/images/rightpanel/icon-sun.svg" alt="freya-layout">
          <div class="weather-info">
            <h6>Ankara, 22 May</h6>
            <h1>24º</h1>
          </div>
        </div>
      </div>

      <div class="rightpanel-section tasks-section">
        <div class="section-header">
          <h6>My list</h6>
          <Button
            type="button"
            icon="pi pi-plus"
            class="p-button-secondary p-button-text p-button-rounded"
          />
        </div>
        <ul>
          <li>
            <div class="task-info">
              <h6>Perform usability testing for P15 MVP</h6>
              <span>-Public pages</span>
              <span>-Product pages</span>
            </div>
          </li>
          <li>
            <div class="task-info">
              <h6>Buy puzzle set from Amazon</h6>
              <span>Ravensburger Seurat, 2000</span>
            </div>
          </li>
          <li class="done">
            <div class="task-info">
              <h6>Morning Run</h6>
            </div>
            <i class="pi pi-check" />
          </li>
          <li class="done">
            <div class="task-info">
              <h6>Morning Run</h6>
            </div>
            <i class="pi pi-check" />
          </li>
        </ul>
      </div>

      <div class="rightpanel-section favorites-section">
        <div class="section-header">
          <h6>Favorites</h6>
        </div>
        <div class="favorite-items">
          <a href="#" class="favorite-item">
            <img src="/demo/images/rightpanel/github.svg" alt="freya-layout">
          </a>
          <a href="#" class="favorite-item">
            <img src="/demo/images/rightpanel/slack.svg" alt="freya-layout">
          </a>
          <a href="#" class="favorite-item">
            <img src="/demo/images/rightpanel/aws.svg" alt="freya-layout">
          </a>
          <a href="#" class="favorite-item">
            <img src="/demo/images/rightpanel/jenkins.svg" alt="freya-layout">
          </a>
          <a href="#" class="favorite-item">
            <img src="/demo/images/rightpanel/jira.svg" alt="freya-layout">
          </a>
          <a href="#" class="add-item" aria-label="add-item">
            <i class="pi pi-plus" />
          </a>
        </div>
      </div>

      <div class="rightpanel-section chat-section chat">
        <TabView>
          <TabPanel>
            <template #header>
              <img
                src="/demo/images/rightpanel/profile-1.png"
                alt="freya-layout"
              >
              <span class="p-badge">3</span>
            </template>
            <div class="chat">
              <span class="fade" />
              <div class="chat-content">
                <div class="chat-message send">
                  <span class="name">You</span>
                  <div class="message">
                    <p>
                      Hey M. hope you are well. Our idea is accepted by the
                      board. Now it’s time to execute it.
                    </p>
                    <span>3 mins ago</span>
                  </div>
                  <div class="message">
                    <p>we did it! 🤠</p>
                    <span>3 mins ago</span>
                  </div>
                </div>
                <div class="chat-message">
                  <span class="name">Micheal J.</span>
                  <div class="message">
                    <p>That’s really good!</p>
                    <span>3 mins ago</span>
                  </div>
                </div>
                <div class="chat-message send">
                  <span class="name">You</span>
                  <div class="message">
                    <p>But it’s important to ship MVP ASAP</p>
                    <span>3 mins ago</span>
                  </div>
                </div>
                <div class="chat-message">
                  <span class="name">Micheal J.</span>
                  <div class="message">
                    <p>
                      I’ll be looking at the process then, just to be sure 🤓
                    </p>
                    <span>3 mins ago</span>
                  </div>
                </div>
                <div class="chat-message send">
                  <span class="name">You</span>
                  <div class="message">
                    <p>That’s awesome. Thanks!</p>
                    <span>3 mins ago</span>
                  </div>
                </div>
                <div class="chat-message" />
              </div>
              <div class="chat-input">
                <InputText type="text" placeholder="Write here..." />
              </div>
            </div>
          </TabPanel>
          <TabPanel>
            <template #header>
              <img
                src="/demo/images/rightpanel/profile-2.png"
                alt="freya-layout"
              >
              <span class="p-badge">1</span>
            </template>
            <div class="chat">
              <span class="fade" />
              <div class="chat-content">
                <div class="chat-message">
                  <span class="name">Sarah</span>
                  <div class="message">
                    <p>That’s really good!</p>
                    <span>3 mins ago</span>
                  </div>
                </div>
                <div class="chat-message send">
                  <span class="name">You</span>
                  <div class="message">
                    <p>But it’s important to ship MVP ASAP</p>
                    <span>3 mins ago</span>
                  </div>
                </div>
                <div class="chat-message" />
              </div>
              <div class="chat-input">
                <InputText type="text" placeholder="Write here..." />
              </div>
            </div>
          </TabPanel>
          <TabPanel>
            <template #header>
              <img
                src="/demo/images/rightpanel/profile-3.png"
                alt="freya-layout"
              >
            </template>
            <div class="chat">
              <div class="chat-content no-message">
                <h4>No Message From Margret K.</h4>
              </div>
              <div class="chat-input">
                <InputText type="text" placeholder="Write here..." />
              </div>
            </div>
          </TabPanel>
          <TabPanel>
            <template #header>
              <img
                src="/demo/images/rightpanel/profile-4.png"
                alt="freya-layout"
              >
            </template>
            <div class="chat">
              <div class="chat-content no-message">
                <h4>No Message From Bob C.</h4>
              </div>
              <div class="chat-input">
                <InputText type="text" placeholder="Write here..." />
              </div>
            </div>
          </TabPanel>
          <TabPanel>
            <template #header>
              <i class="pi pi-plus" />
            </template>
            <div class="chat">
              <span class="fade" />
              <div class="contacts">
                <ul>
                  <li>
                    <img
                      src="/demo/images/rightpanel/profile-1.png"
                      alt="freya-layout"
                    >
                    <div class="contact-info">
                      <h6>John Doe</h6>
                      <span>Active</span>
                    </div>
                  </li>
                  <li>
                    <img
                      src="/demo/images/rightpanel/profile-2.png"
                      alt="freya-layout"
                    >
                    <div class="contact-info">
                      <h6>John Doe</h6>
                      <span>Active</span>
                    </div>
                  </li>
                  <li>
                    <img
                      src="/demo/images/rightpanel/profile-3.png"
                      alt="freya-layout"
                    >
                    <div class="contact-info">
                      <h6>John Doe</h6>
                      <span>Active</span>
                    </div>
                  </li>
                  <li>
                    <img
                      src="/demo/images/rightpanel/profile-4.png"
                      alt="freya-layout"
                    >
                    <div class="contact-info">
                      <h6>John Doe</h6>
                      <span>Active</span>
                    </div>
                  </li>
                  <li>
                    <img
                      src="/demo/images/rightpanel/profile-1.png"
                      alt="freya-layout"
                    >
                    <div class="contact-info">
                      <h6>John Doe</h6>
                      <span>Active</span>
                    </div>
                  </li>
                  <li>
                    <img
                      src="/demo/images/rightpanel/profile-1.png"
                      alt="freya-layout"
                    >
                    <div class="contact-info">
                      <h6>John Doe</h6>
                      <span>Active</span>
                    </div>
                  </li>
                  <li>
                    <img
                      src="/demo/images/rightpanel/profile-1.png"
                      alt="freya-layout"
                    >
                    <div class="contact-info">
                      <h6>John Doe</h6>
                      <span>Active</span>
                    </div>
                  </li>
                  <li>
                    <img
                      src="/demo/images/rightpanel/profile-1.png"
                      alt="freya-layout"
                    >
                    <div class="contact-info">
                      <h6>John Doe</h6>
                      <span>Active</span>
                    </div>
                  </li>
                  <li>
                    <img
                      src="/demo/images/rightpanel/profile-1.png"
                      alt="freya-layout"
                    >
                    <div class="contact-info">
                      <h6>John Doe</h6>
                      <span>Active</span>
                    </div>
                  </li>
                </ul>
              </div>
              <div class="chat-input">
                <InputText type="text" placeholder="Search new persons" />
              </div>
            </div>
          </TabPanel>
        </TabView>
      </div>
    </div>
  </div>
</template>
