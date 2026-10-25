// NOTE: This will make src/util/penguinmod-analyze-extensions.js and scripts/analyze/last-run.js
// node scripts/analyze/analyze-extension-info.js
const fs = require("fs/promises");
const path = require("path");

// NOTE: All the additional extension URLs to cache
const EXTENSION_URLS = {
    // PenguinMod
    "penP": "https://extensions.penguinmod.com/extensions/ObviousAlexC/PenPlus.js",
    "DebuggerExtensionTS": "https://extensions.penguinmod.com/extensions/TheShovel/shoveldebugger.js",
    "ikeleneServerStorage": "https://extensions.penguinmod.com/extensions/Ikelene/serverStorageExtension.js",
    "g1nxBettererStorage": "https://extensions.penguinmod.com/extensions/Gen1x/storage_plus.js",
    "qoanrenderer": "https://extensions.penguinmod.com/extensions/TheShovel/qoan-renderer.js",
    "P7BoxPhys": "https://extensions.penguinmod.com/extensions/pooiod/Box2D.js",
    "g1nxLighting": "https://extensions.penguinmod.com/extensions/Gen1x/lighting.js",
    "obviousAlexCMath3d": "https://extensions.penguinmod.com/extensions/ObviousAlexC/3DMath.js",
    "gpusb3": "https://extensions.penguinmod.com/extensions/derpygamer2142/gpusb3.js",
    "beatSync": "https://extensions.penguinmod.com/extensions/Gen1x/beat_sync.js",
    "skyhigh173object": "https://extensions.penguinmod.com/extensions/skyhigh173/object.js",
    "0zCsv": "https://extensions.penguinmod.com/extensions/0znzw/ScopeVars.js",
    "steve0greatnesstimers": "https://extensions.penguinmod.com/extensions/steve0greatness/timers.js",
    "pooiod7Dictation": "https://extensions.penguinmod.com/extensions/pooiod/Dictation.js",
    "imagevisionquickdraw": "https://extensions.penguinmod.com/extensions/TheShovel/doodlerec.js",
    "SDStylusExtension": "https://extensions.penguinmod.com/extensions/sourdoggy/stylus extension.js",
    "puzzlinggggttsrv2": "https://extensions.penguinmod.com/extensions/PuzzlingGGG/ttsrV2.js",
    "cloudlink": "https://extensions.penguinmod.com/extensions/MikeDev101/cloudlink.js",
    "e2ee": "https://extensions.penguinmod.com/extensions/MikeDev101/e2ee.js",
    "webrtc": "https://extensions.penguinmod.com/extensions/MikeDev101/webrtc.js",
    "spritesheeter": "https://extensions.penguinmod.com/extensions/MubiLop/spritesheeter.js",
    "dumzdevBGRemover": "https://extensions.penguinmod.com/extensions/dumzdev/removebg.js",
    "penguinGPT": "https://extensions.penguinmod.com/extensions/MubiLop/penguingpt.js",
    "pangpalgemini": "https://extensions.penguinmod.com/extensions/TheShovel/blockAI.js",
    "mubiloppenguinhook": "https://extensions.penguinmod.com/extensions/MubiLop/penguinhook.js",
    "numberUtilities": "https://extensions.penguinmod.com/extensions/MubiLop/numutils.js",
    "jwklongmathematics": "https://extensions.penguinmod.com/extensions/jwklong/mathematics.js",
    "qxsckbignumber": "https://extensions.penguinmod.com/extensions/qxsck/big-decimal.js",
    "formatNumbers": "https://extensions.penguinmod.com/extensions/DogeisCut/FormatNumbers.js",
    "ddeDateFormatV2": "https://extensions.penguinmod.com/extensions/ddededodediamante/dateFormatV2.js",
    "embintranslation": "https://extensions.penguinmod.com/extensions/Embin/embintranslation.js",
    "dogeiscutyetanotherstringextension": "https://extensions.penguinmod.com/extensions/DogeisCut/YetAnotherStringExtension.js",
    "dogeiscutRegularExpressions": "https://extensions.penguinmod.com/extensions/DogeisCut/dogeiscutRegularExpressions.js",
    "dogeiscutSet": "https://extensions.penguinmod.com/extensions/DogeisCut/dogeiscutSet.js",
    "divIterator": "https://extensions.penguinmod.com/extensions/Div/divIterators.js",
    "divAlgEffects": "https://extensions.penguinmod.com/extensions/Div/divAlgEffects.js",
    "FaunksBlobs": "https://extensions.penguinmod.com/extensions/Faunks/Blobs.js",
    "randomutils": "https://extensions.penguinmod.com/extensions/Gen1x/random_utils.js",
    "toastnotifs": "https://extensions.penguinmod.com/extensions/MubiLop/toastnotifs.js",
    "lordcatprojectinterfaces": "https://extensions.penguinmod.com/extensions/LordCat0/ProjectInterfaces.js",
    "gitpenguin": "https://extensions.penguinmod.com/extensions/justablock/gitpenguin.js",
    "sammerpenguinapi": "https://extensions.penguinmod.com/extensions/SammerLOL/pangapi.js",
    "turboweather": "https://extensions.penguinmod.com/extensions/RubyDevs/turboweather.js",
    "BPixelCockatiel": "https://extensions.penguinmod.com/extensions/bruhbeast-pixel/CockatielLocation.js",
    "nkcorsproxy": "https://extensions.penguinmod.com/extensions/NamelessCat/corsproxy.js",
    "jodieextexp": "https://extensions.penguinmod.com/extensions/TheShovel/extexp.js",
    "lmsAllMenus": "https://extensions.penguinmod.com/extensions/Lily/AllMenus.js",
    "0znzwMoreFields": "https://extensions.penguinmod.com/extensions/Ashime/MoreFields.js",
    "dogeiscutbeepboxplayer": "https://extensions.penguinmod.com/extensions/DogeisCut/BeepBoxPlayer.js",
    "ACatUpdateFile": "https://extensions.penguinmod.com/extensions/Anonymous_cat1/updateFile.js",
    "yeetyourfiles": "https://extensions.penguinmod.com/extensions/MubiLop/yeetyourfiles.js",
    "cfupload": "https://extensions.penguinmod.com/extensions/Codefoxy/cfupload.js",
    "p7videosharing": "https://extensions.penguinmod.com/extensions/pooiod/VideoSharing.js",
    "p7windowhash": "https://extensions.penguinmod.com/extensions/pooiod/WindowHasher.js",
    "scratchblocks": "https://extensions.penguinmod.com/extensions/pooiod/Scratchblocks.js",
    "authpenguin": "https://extensions.penguinmod.com/extensions/MubiLop/authpenguin.js",
    "googleAuth": "https://extensions.penguinmod.com/extensions/Ikelene/googleAuthExtension.js",
    "discordauth": "https://extensions.penguinmod.com/extensions/NotHouse/DiscordAuth.js",
    "bopTwitch": "https://extensions.penguinmod.com/extensions/bop_tw/Twitch.js",
    "chessG1nX": "https://extensions.penguinmod.com/extensions/Gen1x/chess-ext.js",
    "ginxilovecats": "https://extensions.penguinmod.com/extensions/Gen1x/CATS.js",
    "FreeServers": "https://extensions.penguinmod.com/extensions/WAYLIVES/FreeServers.js",
    "vgscompiledvalues": "https://extensions.penguinmod.com/extensions/VeryGoodScratcher42/More-Types.js",
    "onkeoPetExtension": "https://extensions.penguinmod.com/extensions/TheShovel/oneko.js",
    "redstoniacounterplusplus": "https://extensions.penguinmod.com/extensions/MrRedstonia/counterplusplus.js",
    "monochromasityhml": "https://extensions.penguinmod.com/extensions/Monochromasity/howmanylines.js",
    "fruitsPaintUtils": "https://extensions.penguinmod.com/extensions/Fruits555000/PaintUtils.js",
    "dogeiscutResolution": "https://extensions.penguinmod.com/extensions/DogeisCut/Resolution.js",
    "gaimeriDeviceMotionExtension": "https://extensions.penguinmod.com/extensions/gaimerI17/DeviceMotion.js",
    "gaimeriCryptoExtension": "https://extensions.penguinmod.com/extensions/gaimerI17/crypto.js",
    "onlinecaptcha": "https://extensions.penguinmod.com/extensions/NotHouse/OnlineCaptcha.js",
    "g1nxbetterstorage": "https://extensions.penguinmod.com/extensions/Gen1x/better_storage.js",
    "mouthwasher": "https://extensions.penguinmod.com/extensions/Gen1x/mouth_washer.js",
    "beep": "https://extensions.penguinmod.com/extensions/electricfuzzball_pm/firealarm.js",
    "stagecompanion": "https://extensions.penguinmod.com/extensions/electricfuzzball_pm/StageBrah.js",
    "midi": "https://extensions.penguinmod.com/extensions/electricfuzzball_pm/MIDI.js",
    "agBuffer": "https://extensions.penguinmod.com/extensions/AndrewGaming587/agBuffer.js",
    "blackMold": "https://extensions.penguinmod.com/extensions/electricfuzzball_pm/blackMold.js",
    // turbowarp
    "text": "https://extensions.turbowarp.org/lab/text.js",
    "faceSensing": "https://extensions.turbowarp.org/lab/face-sensing.js",
    "videoSprites": "https://extensions.turbowarp.org/lab/video-sprites.js",
    "stretch": "https://extensions.turbowarp.org/stretch.js",
    "Gamepad": "https://extensions.turbowarp.org/gamepad.js",
    "griffpatch": "https://extensions.turbowarp.org/box2d.js",
    "files": "https://extensions.turbowarp.org/files.js",
    "pointerlock": "https://extensions.turbowarp.org/pointerlock.js",
    "MouseCursor": "https://extensions.turbowarp.org/cursor.js",
    "runtimeoptions": "https://extensions.turbowarp.org/runtime-options.js",
    "fetch": "https://extensions.turbowarp.org/fetch.js",
    "strings": "https://extensions.turbowarp.org/text.js",
    "localstorage": "https://extensions.turbowarp.org/local-storage.js",
    "truefantombase": "https://extensions.turbowarp.org/true-fantom/base.js",
    "Bitwise": "https://extensions.turbowarp.org/bitwise.js",
    "skyhigh173BigInt": "https://extensions.turbowarp.org/Skyhigh173/bigint.js",
    "utilities": "https://extensions.turbowarp.org/utilities.js",
    "notSound": "https://extensions.turbowarp.org/sound.js",
    "lmsVideo": "https://extensions.turbowarp.org/Lily/Video.js",
    "iframe": "https://extensions.turbowarp.org/iframe.js",
    "clayhtmlencode": "https://extensions.turbowarp.org/Clay/htmlEncode.js",
    "xeltallivclipblend": "https://extensions.turbowarp.org/Xeltalliv/clippingblending.js",
    "clipboard": "https://extensions.turbowarp.org/clipboard.js",
    "penP": "https://extensions.turbowarp.org/obviousAlexC/penPlus.js",
    "betterpen": "https://extensions.turbowarp.org/penplus.js",
    "xeltallivSimple3D": "https://extensions.turbowarp.org/Xeltalliv/simple3D.js",
    "lmsSkins": "https://extensions.turbowarp.org/Lily/Skins.js",
    "obviousalexsensing": "https://extensions.turbowarp.org/obviousAlexC/SensingPlus.js",
    "cubesterKeySimulation": "https://extensions.turbowarp.org/CubesterYT/KeySimulation.js",
    "lmsclonesplus": "https://extensions.turbowarp.org/Lily/ClonesPlus.js",
    "lmsLooksPlus": "https://extensions.turbowarp.org/Lily/LooksPlus.js",
    "lmsMoreEvents": "https://extensions.turbowarp.org/Lily/MoreEvents.js",
    "lmsListTools": "https://extensions.turbowarp.org/Lily/ListTools.js",
    "mobilekeyboard0419": "https://extensions.turbowarp.org/veggiecan/mobilekeyboard.js",
    "nkmoremotion": "https://extensions.turbowarp.org/NexusKitten/moremotion.js",
    "cubesterWindowControls": "https://extensions.turbowarp.org/CubesterYT/WindowControls.js",
    "fullscreen0419": "https://extensions.turbowarp.org/veggiecan/browserfullscreen.js",
    "shreder95resolution": "https://extensions.turbowarp.org/shreder95ua/resolution.js",
    "xmerclosecontrol": "https://extensions.turbowarp.org/XmerOriginals/closecontrol.js",
    "navigatorinfo": "https://extensions.turbowarp.org/navigator.js",
    "battery": "https://extensions.turbowarp.org/battery.js",
    "pwldevvibration": "https://extensions.turbowarp.org/PwLDev/vibration.js",
    "shovelcss": "https://extensions.turbowarp.org/TheShovel/CustomStyles.js",
    "shovelColorPicker": "https://extensions.turbowarp.org/TheShovel/ColorPicker.js",
    "nkcontrols": "https://extensions.turbowarp.org/NexusKitten/controlcontrols.js",
    "mdwaltersnotifications": "https://extensions.turbowarp.org/mdwalters/notifications.js",
    "dtbyxeroname": "https://extensions.turbowarp.org/XeroName/Deltatime.js",
    "AR": "https://extensions.turbowarp.org/ar.js",
    "Encoding": "https://extensions.turbowarp.org/encoding.js",
    "SPtuneShark3": "https://extensions.turbowarp.org/SharkPool/Tune-Shark-V3.js",
    "lmsSoundExpanded": "https://extensions.turbowarp.org/Lily/SoundExpanded.js",
    "lmsTempVars2": "https://extensions.turbowarp.org/Lily/TempVariables2.js",
    "lmsTimers": "https://extensions.turbowarp.org/Lily/MoreTimers.js",
    "clouddataping": "https://extensions.turbowarp.org/clouddata-ping.js",
    "cloudlink": "https://extensions.turbowarp.org/cloudlink.js",
    "truefantomnetwork": "https://extensions.turbowarp.org/true-fantom/network.js",
    "truefantommath": "https://extensions.turbowarp.org/true-fantom/math.js",
    "truefantomregexp": "https://extensions.turbowarp.org/true-fantom/regexp.js",
    "truefantomcouplers": "https://extensions.turbowarp.org/true-fantom/couplers.js",
    "samuelloufgeolocation": "https://extensions.turbowarp.org/SamuelLouf/Geolocation.js",
    "dogeiscutformatnumbers": "https://extensions.turbowarp.org/DogeisCut/FormatNumbers.js",
    "lmsAllMenus": "https://extensions.turbowarp.org/Lily/AllMenus.js",
    "lmsHackedBlocks": "https://extensions.turbowarp.org/Lily/HackedBlocks.js",
    "lmsCast": "https://extensions.turbowarp.org/Lily/Cast.js",
    "sipctime": "https://extensions.turbowarp.org/-SIPC-/time.js",
    "sipcconsole": "https://extensions.turbowarp.org/-SIPC-/consoles.js",
    "zxmushroom63searchparams": "https://extensions.turbowarp.org/ZXMushroom63/searchApi.js",
    "ShovelUtils": "https://extensions.turbowarp.org/TheShovel/ShovelUtils.js",
    "lmsAssets": "https://extensions.turbowarp.org/Lily/Assets.js",
    "SPASfontManager": "https://extensions.turbowarp.org/SharkPool/Font-Manager.js",
    "dninwakelock": "https://extensions.turbowarp.org/DNin/wake-lock.js",
    "skyhigh173JSON": "https://extensions.turbowarp.org/Skyhigh173/json.js",
    "mbwxml": "https://extensions.turbowarp.org/mbw/xml.js",
    "numericalencoding2": "https://extensions.turbowarp.org/numerical-encoding-2.js",
    "cs2627883NumericalEncoding": "https://extensions.turbowarp.org/cs2627883/numericalencoding.js",
    "SPcamera": "https://extensions.turbowarp.org/SharkPool/Camera.js",
    "DTcameracontrols": "https://extensions.turbowarp.org/DT/cameracontrols.js",
    "theshovelcanvaseffects": "https://extensions.turbowarp.org/TheShovel/CanvasEffects.js",
    "lbdrawtest": "https://extensions.turbowarp.org/Longboost/color_channels.js",
    "cst1229zip": "https://extensions.turbowarp.org/CST1229/zip.js",
    "images": "https://extensions.turbowarp.org/CST1229/images.js",
    "shovellzcompress": "https://extensions.turbowarp.org/TheShovel/LZ-String.js",
    "0832rxfs2": "https://extensions.turbowarp.org/0832/rxFS2.js",
    "nexuskittensgrab": "https://extensions.turbowarp.org/NexusKitten/sgrab.js",
    "nonameawagraph": "https://extensions.turbowarp.org/NOname-awa/graphics2d.js",
    "nonameawacomparisons": "https://extensions.turbowarp.org/NOname-awa/more-comparisons.js",
    "jeremygamerTweening": "https://extensions.turbowarp.org/JeremyGamer13/tween.js",
    "RixxyX": "https://extensions.turbowarp.org/rixxyx.js",
    "lmsutilsblocks": "https://extensions.turbowarp.org/Lily/lmsutils.js",
    "qxsckdataanalysis": "https://extensions.turbowarp.org/qxsck/data-analysis.js",
    "qxsckvarandlist": "https://extensions.turbowarp.org/qxsck/var-and-list.js",
    "verctedictionaries": "https://extensions.turbowarp.org/vercte/dictionaries.js",
    "gsaHTTPRequests": "https://extensions.turbowarp.org/godslayerakp/http.js",
    "gsaWebsocket": "https://extensions.turbowarp.org/godslayerakp/ws.js",
    "cubesterWebhooks": "https://extensions.turbowarp.org/CubesterYT/Webhooks.js",
    "lmscomments": "https://extensions.turbowarp.org/Lily/CommentBlocks.js",
    "longvegdictionary": "https://extensions.turbowarp.org/veggiecan/LongmanDictionary.js",
    "alestorenfc": "https://extensions.turbowarp.org/Alestore/nfcwarp.js",
    "nishiowoDectalk": "https://extensions.turbowarp.org/NishiOwO/dectalk.js",
    "steamworks": "https://extensions.turbowarp.org/steamworks.js",
    "itch": "https://extensions.turbowarp.org/itchio.js",
    "GameJoltAPI": "https://extensions.turbowarp.org/gamejolt.js",
    "NGIO": "https://extensions.turbowarp.org/obviousAlexC/newgroundsIO.js",
    "lmsmcutils": "https://extensions.turbowarp.org/Lily/McUtils.js",
    // SharkPool
    "SharkPoolSharktilities": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Sharktilities.js",
    "SPyoutubeoperations": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/YouTube-Operations.js",
    "SPscratchUtilities": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Scratch-Utilities.js",
    "SPtuneShark3": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Tune-Shark-V3.js",
    "SPtuneShark": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Tune-Shark.js",
    "SPcamera": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Camera.js",
    "SPaddedmotion": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Added-Motion.js",
    "GDapiSP": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Geometry-Dash-API.js",
    "SPsoundWaves": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Sound-Waves.js",
    "HyperSense2SP": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Hyper-Sense-V2.js",
    "enderKeysPlusV2": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/KeysPlusV2.js",
    "SPpopups": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Popup-Phoenix.js",
    "BetterInputSP": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Better-Input.js",
    "CameraSensingPlusSP": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Camera-Sensing-Plus.js",
    "SPpartEngine": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Particle-Engine.js",
    "ParticleToolsSP": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Particle-Tools.js",
    "SPlooksExpanded": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Looks-Expanded.js",
    "SPspriteEffectsV2": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Sprite-Effects-V2.js",
    "imgEffectsSP": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Image-Effects.js",
    "SPimgEditor": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Image-Editor.js",
    "lbgpixelutilities": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Pixel-Utilities.js",
    "SPrecording2": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Recording-V2.js",
    "SPaudioNG": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Newgrounds-Audio.js",
    "SPspriteParent": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Sprite-Parenting.js",
    "SPrigidBody": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Rigidbodies.js",
    "LZcollisionsSP": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Lazy-Collisions.js",
    "filesExpanded": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Files-Expanded.js",
    "SPtempVars": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Temporary-Variables.js",
    "DICandSPmonitorsPlus": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Variables-Expanded.js",
    "SPlistMonitors": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Sty-Lists.js",
    "Gamepad": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Gamepad-Expanded.js",
    "SPgrids": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Tile-Grids.js",
    "SPanimations": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Animations.js",
    "SPttsV2": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Text-to-Speech-V2.js",
    "SPASfontManager": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Font-Manager.js",
    "SPpauseV2": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Pause.js",
    "SPscripts": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Script-Control.js",
    "SPmessagePlus": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Messages-Plus.js",
    "SPmessages": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Advanced-Messages.js",
    "SPeventsPlus": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Events-Plus.js",
    "SPevents": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Runtime-Events.js",
    "SPprogress": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Fetch-Progress.js",
    "SPgeolocation": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Geolocation.js",
    "SPspotify": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Spotify.js",
    "SPsoundCloud": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/SoundCloud-API.js",
    "SPspreads": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Google-Spreadsheets.js",
    "SPmoney": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Money-Utilities.js",
    "SPdisplayTextV2": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Display-Text-V2.js",
    "SPcolorMaster": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Color-Master.js",
    "SPqrCodes": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/QR-Codes.js",
    "speechSP": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Speech-Bubbles.js",
    "SPlayering": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Layer-Control.js",
    "SPrenderControl": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Renderer-Control.js",
    "SPtimeCalc": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Time-Calculation.js",
    "iStimezones": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Timezones.js",
    "since2000": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Since-2000.js",
    "SeedsSP": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Seeds.js",
    "SPperlin": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Perlin-Noise.js",
    "SPadvControl": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Extra-Controls.js",
    "SPmoreOPs": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/More-Operators.js",
    "SPcaptcha": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Captchas.js",
    "SPcomments": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Better-Comments.js",
    "SPspritePanel": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Sprite-Panel.js",
    "SPdomSelect": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/DOM-Selector.js",
    "SPsvgSheets": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/SVG-Spritesheets.js",
    "SPspotlight": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Community-Spotlight.js",
    "SPgifManager": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/GIF-Manager.js",
    "SPjson": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/JSON-Array.js",
    "SPmbpCST": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/My-Blocks-Plus.js",
    "SP0zMenuMaker": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Dropdown-Maker.js",
    "SPturboSkins": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Turbo-Skins.js",
    "SPscenes": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Scenes.js",
    "SPpenPapers": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/Pen-Papers.js",
    "ObscurasMIDITools": "https://sharkpool-sp.github.io/SharkPools-Extensions/extension-code/MIDI-Tools.js",
    // cst1229
    "cst1229multiline": "https://cst1229.eu.org/extensions/multilinetext.js",
    "cst1229extendable2": "https://cst1229.eu.org/extensions/extendableblocks2.js",
    "cst1229scratch22": "https://cst1229.eu.org/extensions/scratch22.js",
    // turbololder
    "jeremygameraepicamrbeastuitolaa": "https://turbololder.vercel.app/extensions/mrbeastutil.js",
    "JungleInferno": "https://turbololder.vercel.app/extensions/jungleinferno.js",
    // analyzed from existing projects
    "WebExtension": "https://gabsthecuriouskid.github.io/DinosaurModExtensions/extensions/webextension.js",
};

// NOTE: these we dont bother trying to get again
const DEFAULT_EXTENSION_COLOR = "#0FBD8C";
const EXTENSION_INFO = {};
const KNOWN_EXTENSION_INFO = {
    // Core categories
    motion: { name: 'Motion', color: '#4C97FF' },
    looks: { name: 'Looks', color: '#9966FF' },
    sound: { name: 'Sound', color: '#D65CD6' },
    event: { name: 'Events', color: '#FFD500' },
    control: { name: 'Control', color: '#FFAB19' },
    sensing: { name: 'Sensing', color: '#4CBFE6' },
    operator: { name: 'Operators', color: '#40BF4A' },
    // NOTE: `data` is technically the category here but it is hardcoded to just be variables & lists
    variables: { name: 'Variables', color: '#FF8C1A' },
    lists: { name: 'Lists', color: '#FF661A' },
    procedures: { name: 'My Blocks', color: '#FF6680' },
    // stuff we cant get from fetching
    jg3d: { name: '3D', color: '#B100FE' },
    // NOTE: These are missing CORS so users likely use them via import file/text rather than URL
    cst12293d: { name: 'CST 3D', color: '#2a47e8' },
    cst1229extendable: { name: 'Extendable Blocks', color: DEFAULT_EXTENSION_COLOR },
    // just the last run's info
    ...(require("./last-run.js")),
};

const OUTPUT_PATH = path.join(__dirname, "../../src/util/penguinmod-analyze-extensions.js");
const OUTPUT_PATH_LAST = path.join(__dirname, "./last-run.js");

const getHsvFromHex = hexCode => {
    hexCode = hexCode.slice(1)
    if (hexCode.length === 3) {
        const r = hexCode.slice(0, 1)
        const g = hexCode.slice(1, 2)
        const b = hexCode.slice(2, 3)
        hexCode = `${r}${r}${g}${g}${b}${b}`
    }

    const r = parseInt(hexCode.slice(0, 2), 16) / 255;
    const g = parseInt(hexCode.slice(2, 4), 16) / 255;
    const b = parseInt(hexCode.slice(4, 6), 16) / 255;
    const x = Math.min(Math.min(r, g), b);
    const v = Math.max(Math.max(r, g), b);

    // For grays, hue will be arbitrarily reported as zero. Otherwise, calculate
    let h = 0;
    let s = 0;
    if (x !== v) {
        const f = (r === x) ? g - b : ((g === x) ? b - r : r - g);
        const i = (r === x) ? 3 : ((g === x) ? 5 : 1);
        h = ((i - (f / (v - x))) * 60) % 360;
        s = (v - x) / v;
    }

    return { h, s, v };
};

// fill in the info we know
for (const category in KNOWN_EXTENSION_INFO) {
    const knownInfo = KNOWN_EXTENSION_INFO[category];
    if (!knownInfo.id) knownInfo.id = category;
    if (!knownInfo.name) knownInfo.name = category;
    if (!knownInfo.color) knownInfo.color = DEFAULT_EXTENSION_COLOR;
    if (!knownInfo.hsv) knownInfo.hsv = getHsvFromHex(knownInfo.color);
    EXTENSION_INFO[category] = knownInfo;
}

// start fetching things
(async () => {
    // resolve the core extensions in PenguinMod
    const coreExtRegex = /([\w$_]+):\s+\(\)\s+=>\s+require\(['"`](.+)['"`]\)/ig;
    const extensionObjectRegex = /const defaultBuiltinExtensions = {(.+)};/s;
    const extensionManagerUrl = 'https://raw.githubusercontent.com/PenguinMod/PenguinMod-Vm/develop/src/extension-support/extension-manager.js';

    // get the extensions object
    const response = await fetch(extensionManagerUrl);
    const code = await response.text();
    const internalExtensions = extensionObjectRegex.exec(code)[1];

    // turn each extension into its own file path
    // right now we have matched something like this:
    // jgDev: () => require("../extensions/jg_dev")
    for (const [_, id, extPath] of internalExtensions.matchAll(coreExtRegex)) {
        let gitUrl = '/src/extensions/' + extPath;
        if (!gitUrl.endsWith('.js')) gitUrl += '/index.js';
        EXTENSION_URLS[id] = `https://raw.githubusercontent.com/PenguinMod/PenguinMod-Vm/develop/${gitUrl}`;
    }

    const getRegexInfoFromExtension = async (id, url) => {
        try {
            const response = await fetch(url);
            const code = await response.text();

            const extColorRegex = /color1["'`]?\s*:\s*["'`]?(#[a-f\d]{3}(?:[a-f\d]{3})?)/i;
            const extNameRegex = /name["'`]?:\s+(Scratch\.translate\(|formatMessage\({\s+id:\s["'`].+["'`],\s+default:\s+)?["'`](.+)["'`]\)?/i;
            const [_, __, name] = extNameRegex.exec(code) ?? [];
            const [___, color] = extColorRegex.exec(code) ?? [];

            const hexRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

            // NOTE: there's no real name limit but anything > 256 is probably a mismatch
            const isValidName = name && (name.length > 0 && name.length < 256);
            const isValidColor = hexRegex.test(color ?? DEFAULT_EXTENSION_COLOR);
            return {
                name: isValidName ? (name ?? id) : id,
                color: isValidColor ? (color ?? DEFAULT_EXTENSION_COLOR) : DEFAULT_EXTENSION_COLOR,
            };
        } catch (err) {
            return {
                name: id,
                color: DEFAULT_EXTENSION_COLOR,
            };
        }
    }

    // fetch the extensions
    for (const extensionId in EXTENSION_URLS) {
        if (EXTENSION_INFO[extensionId]) continue;

        try {
            const extensionUrl = EXTENSION_URLS[extensionId];
            console.log("fetching", extensionUrl);
            const { name, color } = await getRegexInfoFromExtension(extensionId, extensionUrl);
            const hsv = getHsvFromHex(color);
            EXTENSION_INFO[extensionId] = {
                id: extensionId,
                url: extensionUrl,
                name: name,
                color: color,
                hsv: hsv,
            };
        } catch (err) {
            console.warn(err);
        }
    }

    // write
    const finalJsCode = `
/**!
 * @fileoverview This file is automatically generated from scripts/analyze/analyze-extension-info.js
 * Do not edit this file manually.
 */

const EXTENSION_INFO = ${JSON.stringify(EXTENSION_INFO, null, 4)};

module.exports = EXTENSION_INFO;

/**!
 * @fileoverview This file is automatically generated from scripts/analyze/analyze-extension-info.js
 * Do not edit this file manually.
 */
        `;
    const finalCacheCode = `// NOTE: This file is rewritten automatically, but you can generally use this file to override any buggy/garbage entries.
const LAST_RUN = ${JSON.stringify(EXTENSION_INFO, null, 4)};

module.exports = LAST_RUN;
`;
    console.log("writing final file");
    await fs.writeFile(OUTPUT_PATH, finalJsCode, "utf8");
    console.log("writing cache file");
    await fs.writeFile(OUTPUT_PATH_LAST, finalCacheCode, "utf8");
})();
