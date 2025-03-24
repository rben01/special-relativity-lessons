local o = import '../common.libjsonnet';


o.spec {
  children+: [
    o.photon { children: o.photonAnim },

  ] + o.clock,
}
