class WebRtcTest extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [
      "https://unpkg.com/peerjs@1.2.0/dist/peerjs.min.js",
      // "../src/webcam.es6.js",
    ], 'WebRTC', 'webrtc-container');
  }

  init() {
    // setup
    this.el = document.getElementById('webrtc-container');

    // is there an offer in the URL?
    let offer = URLUtil.getHashQueryVariable('offer');
    if(offer) {
      console.log('offer:', offer);
    }

    // create peer object
    this.peer = new Peer();
    this.conn = null;

    // listen for connection
    this.peer.on('open', (id) => {
      // if no offer, we're the host! so advertise the link
      if(!offer) { 
        let offerLink = document.createElement('a');
        offerLink.href = `${window.location.href}&offer=${id}`;
        offerLink.innerText = offerLink.href;
        this.el.appendChild(offerLink);
      } else {
        console.log('did open, looking for host');
        this.conn = this.peer.connect(offer);

        this.conn.on('connection', (data) => {
          console.log('on connection!', data);
        });

        this.conn.on('data', (data) => {
          console.log('on data!', data);
        });
      }
    });

    // listen for connections
    this.peer.on('connection', (conn) => {
      this.conn = conn;
      console.log('connected!', this.conn);
      this.conn.send('Hello!');

      this.conn.on('open', () => {
        console.log('open connection!');
      });

      this.conn.on('data', (data) => {
        console.log('on data!', data);
      });
    });

    // add listener
    document.body.addEventListener('click', (e) => {
      if(this.conn) this.conn.send(42);
      console.log('click!', this.conn);
    });
	}

}

if(window.autoInitDemo) window.demo = new WebRtcTest(document.body);
