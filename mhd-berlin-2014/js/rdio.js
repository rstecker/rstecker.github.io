var objects = [];
var intersects = [];
var prevData = null;
var intersectObj = null;
var now_playing_block = null;
var track_progression = -1;
var now_playing_details = null;
var absolute_index = 0;
var prev_index = null;

var RATE_SCALE = 0.01;
var MAX_SCALE = 1.5;
var LAYOUT_SCALE = 300;

function update_now_playing() {
  if (now_playing_block) {
    now_playing_block.rotation.x += 0.001
    now_playing_block.rotation.y += 0.005
    now_playing_block.rotation.z += 0.0001
  }
}
function create_rdio_block(x, y, z, scene, url){
  // material
  var material_rdio = new THREE.MeshLambertMaterial({ map: loadImage(url) });

  // cube
  var cube = new THREE.Mesh(new THREE.BoxGeometry(200, 200, 200), material_rdio);
  cube.overdraw = true;
  cube.position.x = x;
  cube.position.y = y;
  cube.position.z = z;

  // cub
  scene.add(cube);
  return cube;
}
function verifyWeWantToPlay(){
  if (intersectObj && intersectObj.rdioData == prevData && intersectObj.rdioData) {  
    playRdioTrack(prevData);
    now_playing_block.material = new THREE.MeshLambertMaterial({ map: loadImage(prevData.icon) });
  } else {
    // console.log("Track play failed to pass debounce");
  }
}
var debounced_verifyWeWantToPlay = _.debounce(verifyWeWantToPlay, 1*1000);

// this runs slighlty less frequently
function findLookingTarget() {
  var mouse3D = new THREE.Vector3( ( 0.5 ) * 2 - 1,   //x
                                  -( 0.5 ) * 2 + 1,  //y
                                     0.5 );          //z
  projector.unprojectVector( mouse3D, camera );
  mouse3D.sub( camera.position );
  mouse3D.normalize();
  var raycaster = new THREE.Raycaster( camera.position, mouse3D );
  intersects = raycaster.intersectObjects( objects );
  if (intersects.length > 0) {
    intersectObj = intersects[0].object;
    if (intersectObj.rdioData != prevData && intersectObj.rdioData) {
      prevData = intersectObj.rdioData;
      debounced_verifyWeWantToPlay();
    }
  } else {
    intersectObj = null;
  }

  rotation = camera.rotation.y;
  var pival = rotation * 180 / Math.PI
  pival = Math.round((pival + 180) * 100)/100.0
  var part = 360/8;
  var pindex = Math.round(pival / part) % 8;
  direction = 'desc';
  if (prev_index == pindex) {
    direction = 'holding';
  } else if ((prev_index < pindex || prev_index > 5 && pindex < 2) && !(prev_index < 2 && pindex > 5)) { 
    direction = 'asc'
  }
  if (direction != 'holding') {
    // console.warn("I am at pival "+pival +" ["+pindex+" -- "+direction+"]");
    _.each(objects, function(obj, i){
      // if (i % 8 == (pindex + 4)%8) {
      //   console.log("HIT!! ["+i+"] "+obj.rdioData.artist+" -- "+obj.rdioData.name)
      // } else {
      //   console.log("\t ["+i+"] "+obj.rdioData.artist+" -- "+obj.rdioData.name)
      // }
    });
  }
  prev_index = pindex;
}

function playRdioTrack(data) {
  document.getElementById('example').setAttribute("class", "loading");
  R.player.volume(0);
  R.player.repeat(R.player.REPEAT_NONE);
  R.player.shuffle(true);
  var length = data.tracks.length;
  var index = (length == 1) ? 0 : _.random(0, length - 1);
  var position = _.random(0, data.tracks[index].duration * 2 / 3)
  R.player.play({
    source: data.key,
    index: index,
    initialPosition: position
  });
  // console.log("Playing something by '" + data.artist, "' from '"+data.name+"'  -- "+index+" of "+length+" (@ "+position+" of "+data.tracks[index].duration+") ", data);
  now_playing_details = addText(data.tracks[index].name, "by " + data.artist, "from "+data.name);
}

// this should run faster
function highlightLooking() {
  objects.forEach(function(x){
    if (intersectObj == x) {
      x.scale.x = Math.min(MAX_SCALE, x.scale.x + RATE_SCALE);
      x.scale.y = Math.min(MAX_SCALE, x.scale.y + RATE_SCALE);
      x.scale.z = Math.min(MAX_SCALE, x.scale.z + RATE_SCALE);
    } else {
      x.scale.x = Math.max(1, x.scale.x - RATE_SCALE);
      x.scale.y = Math.max(1, x.scale.y - RATE_SCALE);
      x.scale.z = Math.max(1, x.scale.z - RATE_SCALE);
    }
  });
}

function addText(line1, line2, line3){
  if (now_playing_details) {
    _.each(now_playing_details, function(c) {
      if (c && c.material) { c.material.dispose(); }
      if (c && c.geometry) { c.geometry.dispose(); }
    });
    scene.remove(now_playing_details);
  }

  var textMaterial3 = new THREE.MeshBasicMaterial( { color: 'rgb(255,255,255)', overdraw: 0.05 });

  var text3d3 = new THREE.TextGeometry( line1, {size: 18, height: 1, curveSegments: 5,font: "helvetiker"});
  text3d3.computeBoundingBox();
  text3 = new THREE.Mesh( text3d3, textMaterial3 );

  text3.position.x = camera.position.x;
  text3.position.y = camera.position.y - 300;
  text3.position.z = camera.position.z + text3.geometry.boundingBox.max.x/2;

  text3.rotation.x = -Math.PI/2;
  text3.rotation.y = 0
  text3.rotation.z = Math.PI/2;

  group = new THREE.Object3D();
  group.add( text3 );

  var text3d3 = new THREE.TextGeometry( line2, {size: 18, height: 1, curveSegments: 5,font: "helvetiker"});
  text3d3.computeBoundingBox();
  text3 = new THREE.Mesh( text3d3, textMaterial3 );

  text3.position.x = camera.position.x + 25;
  text3.position.y = camera.position.y - 300;
  text3.position.z = camera.position.z + text3.geometry.boundingBox.max.x/2;

  text3.rotation.x = -Math.PI/2;
  text3.rotation.y = 0
  text3.rotation.z = Math.PI/2;

  group.add( text3 );

  var text3d3 = new THREE.TextGeometry(line3, {size: 18, height: 1, curveSegments: 5,font: "helvetiker"});
  text3d3.computeBoundingBox();
  text3 = new THREE.Mesh( text3d3, textMaterial3 );

  text3.position.x = camera.position.x + 50;
  text3.position.y = camera.position.y - 300;
  text3.position.z = camera.position.z + text3.geometry.boundingBox.max.x/2;

  text3.rotation.x = -Math.PI/2;
  text3.rotation.y = 0
  text3.rotation.z = Math.PI/2;

  group.add( text3 );
  scene.add( group );
  return group;
}


R.ready(function(ready){
  if (R.authenticated()) {
    load_rdio_content();
    R.player.on('change:position', function(pos) {
      var volume = R.player.volume();
      if (volume < 1) {
        R.player.volume(volume + 0.1);
      }
      // when the track starts loading we go from 0 -> start possition, but there's a long pause
      // before we ACTUALLY start advancing
      if (pos > 0 && track_progression + 1 == pos) {
        document.getElementById('example').setAttribute("class", "");
      }
      track_progression = pos;
      // console.log("Position: "+pos+" \t\tVolume: "+volume)
    });
    R.player.on('change:playingTrack', function(track) {
      if (track.get('key') == 't21529719') {
        return;
      }
      now_playing_details = addText(track.get('name'), "by " + track.get('artist'), "from "+track.get('album'));
      document.getElementById('example').setAttribute("class", "loading");
    });
  } else {
    R.authenticate({mode: 'redirect'});
  }
});

function load_rdio_content(){
  _.delay(function(){
    // Play RIGHT AWAY to get through the annoying popup
    // I could probably find better static noise
    R.player.repeat(R.player.REPEAT_ONE);
    R.player.play({source: "t21529719"});
    document.getElementById('example').setAttribute("class", "");
  }, 1000);

  R.request({
    method: 'getNewReleases',
    content: { 
      start: 0,
      count: 8*4,
      time: 'thisweek',
      extras: ['tracks']
    },
    success: function(data) {
      console.log(data)
      for(var i = 0; i < data.result.length; ++i){
        j = i % 8
        level = Math.floor(i/8.0)
        radian = ((Math.PI * 2.0) / 8) *  j;
        z = LAYOUT_SCALE - Math.cos(radian) * LAYOUT_SCALE * 2;
        x = LAYOUT_SCALE - Math.sin(radian) * LAYOUT_SCALE * 2;
        y = -700 + LAYOUT_SCALE * level;
        c = create_rdio_block(x, y, z, scene, data.result[i].icon);
        c.rotation.y = radian;
        objects.push(c);
        c.rdioData = data.result[i];
        console.log("Putting ["+i+"/"+j+"] @ "+y+"("+level+") \t\t'"+ data.result[i].name+"' by '"+ data.result[i].artist+"'");
      }
      var xs = _.pluck(_.pluck(objects, 'position'), 'x');
      var zs = _.pluck(_.pluck(objects, 'position'), 'z');
      var ys = _.pluck(_.pluck(objects, 'position'), 'y');
      camera.position.z = (_.max(zs) - _.min(zs)) / 2 + _.min(zs)
      camera.position.x = (_.max(xs) - _.min(xs)) / 2 + _.min(xs)
      camera.position.y = (_.max(ys) - _.min(ys)) / 2 + _.min(ys);
      console.log("Putting the camera at "+camera.position.x+", "+camera.position.y+", "+camera.position.z+" ")

      now_playing_block = create_rdio_block(camera.position.x,camera.position.y + 800,camera.position.z,scene, "http://rdio1img-a.akamaihd.net/playlist/5/3/6/00000000007f7635/2/square-200.jpg");
      now_playing_details = addText("enjoy", "Rdio", "by Rebecca");
    }
  });  
}
